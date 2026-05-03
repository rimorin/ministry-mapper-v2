import React, {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from "react";
import {
  TERRITORY_TYPES,
  NOT_HOME_STATUS_CODES,
  DEFAULT_UNIT_PADDING,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS,
  REALTIME_DEBOUNCE_MS
} from "../../utils/constants";
import {
  floorDetails,
  HHOptionProps,
  QueuedOp,
  territoryTableProps,
  unitDetails,
  mapAddressResponse
} from "../../utils/interface";
import PrivateTerritoryTable from "./privatetable";
import PublicTerritoryTable from "./publictable";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import MapPlaceholder from "../statics/placeholder";

import { callFunction, ignoreAbort, pb } from "../../utils/pocketbase";
import { getNextSequence } from "../../utils/helpers/maphelpers";
import {
  saveAddressCache,
  loadAddressCache,
  getQueue,
  applyOpTypes,
  consumeUpgradeLostOpsWarning
} from "../../utils/smartsync";
import { useTranslation } from "react-i18next";
import { useModalManagement } from "../../hooks/useModalManagement";
import useRealtimeSubscription from "../../hooks/useRealtime";
import useOnTabFocus from "../../hooks/useOnTabFocus";
import { useSmartSyncContext } from "../../hooks/useSmartSync";
import { RecordModel } from "pocketbase";
const TerritoryMapView = lazy(() => import("./mapmode"));
// Eager imports — both modals are needed for queued writes and must be
// bundled with this chunk rather than fetched on-demand (which fails offline).
import UpdateUnitStatus from "../modal/updatestatus";
import CreateAddress from "../modal/createaddress";

function applyPendingOpsToAddressMap(
  addressMap: Map<string, unitDetails>,
  pendingOps: QueuedOp[],
  optionCodeMap: Map<string, string>
): void {
  for (const op of pendingOps) {
    if (op.kind === "create" && op.createPayload) {
      if (!addressMap.has(op.addressId)) {
        addressMap.set(op.addressId, {
          id: op.addressId,
          number: op.createPayload.code,
          note: op.updateData.notes,
          status: op.updateData.status,
          nhcount: String(op.updateData.not_home_tries),
          dnctime: op.updateData.dnc_time
            ? Date.parse(op.updateData.dnc_time)
            : 0,
          floor: op.createPayload.floor,
          sequence: op.createPayload.sequence,
          coordinates: op.updateData.coordinates
            ? (JSON.parse(op.updateData.coordinates) as {
                lat: number;
                lng: number;
              })
            : undefined,
          type: applyOpTypes(op, optionCodeMap)
        });
      }
      continue;
    }
    const base = addressMap.get(op.addressId);
    if (!base) continue;
    addressMap.set(op.addressId, {
      ...base,
      status: op.updateData.status,
      note: op.updateData.notes,
      nhcount: String(op.updateData.not_home_tries),
      dnctime: op.updateData.dnc_time ? Date.parse(op.updateData.dnc_time) : 0,
      type: applyOpTypes(op, optionCodeMap)
    });
  }
}

const useAddresses = (
  mapId: string,
  options: Map<string, HHOptionProps>,
  assignmentId?: string,
  pendingAddressIds: Set<string> = new Set()
) => {
  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );
  // Ref kept in sync on every render — lets updateAddressOptimistically read
  // the current Map without going through a functional state updater.
  const addressesRef = useRef<Map<string, unitDetails>>(new Map());
  addressesRef.current = addresses;

  const cacheKey = assignmentId ?? mapId;

  const createUnitDetails = (address: RecordModel): unitDetails => ({
    id: address.id,
    coordinates: address.coordinates,
    number: address.code,
    note: address.notes,
    type: [],
    status: address.status,
    nhcount: String(address.not_home_tries ?? NOT_HOME_STATUS_CODES.DEFAULT),
    dnctime: address.dnc_time ? Date.parse(address.dnc_time) : 0,
    sequence: address.sequence,
    floor: address.floor,
    updated: address.updated ? Date.parse(address.updated) : undefined,
    updatedBy: address.updated_by
  });

  const optionCodeMap = new Map(
    [...options.entries()].map(([id, o]) => [id, o.code])
  );

  const fetchAddressData = ignoreAbort(async () => {
    if (!mapId) return;
    try {
      const response = (await callFunction("/map/addresses", {
        method: "POST",
        body: { map_id: mapId },
        requestKey: `map-addresses-${mapId}`
      })) as mapAddressResponse[];

      const addressMap = new Map<string, unitDetails>();
      for (const addr of response) {
        addressMap.set(addr.id, {
          id: addr.id,
          coordinates: addr.coordinates ?? undefined,
          number: addr.code,
          note: addr.notes,
          type: addr.options.map((ao) => ({
            id: ao.id,
            code: options.get(ao.id)?.code ?? "",
            aoId: ao.aoId
          })),
          status: addr.status,
          nhcount: String(addr.not_home_tries ?? NOT_HOME_STATUS_CODES.DEFAULT),
          dnctime: addr.dnc_time ? Date.parse(addr.dnc_time) : 0,
          sequence: addr.sequence,
          floor: addr.floor,
          updated: addr.updated ? Date.parse(addr.updated) : undefined,
          updatedBy: addr.updated_by
        });
      }

      // Overlay pending smart sync writes on top of the server snapshot.
      // Firestore-style: local writes always take precedence until confirmed.
      // Ops are keyed by `mapId:addressId` so there is at most one op per address.
      const pendingOps = await getQueue(mapId);
      applyPendingOpsToAddressMap(addressMap, pendingOps, optionCodeMap);

      setAddresses(addressMap);
      // Save the overlay-applied state so the cache reflects pending writes.
      void saveAddressCache(cacheKey, Object.fromEntries(addressMap));
    } catch (error) {
      // Rethrow AbortErrors so the ignoreAbort wrapper can handle them
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      const cached = await loadAddressCache(cacheKey);
      if (cached) {
        // Re-apply pending ops on top of the cached snapshot so the user sees
        // their queued edits, not the last-known server state.
        const cachedMap = new Map(Object.entries(cached.data));
        const pendingOps = await getQueue(mapId);
        applyPendingOpsToAddressMap(cachedMap, pendingOps, optionCodeMap);
        setAddresses(cachedMap);
        return;
      }
    }
  });

  const updateAddressOptimistically = (
    addressId: string,
    updateData: QueuedOp["updateData"],
    newTypes: Array<{ id: string; code: string; aoId?: string }>
  ) => {
    const existing = addressesRef.current.get(addressId);
    if (!existing) return;
    const newAddresses = new Map(addressesRef.current);
    newAddresses.set(addressId, {
      ...existing,
      status: updateData.status,
      note: updateData.notes,
      nhcount: String(updateData.not_home_tries),
      dnctime: updateData.dnc_time ? Date.parse(updateData.dnc_time) : 0,
      type: newTypes
    });
    setAddresses(newAddresses);
    // Persist immediately so a page refresh while queued shows the updated state.
    void saveAddressCache(cacheKey, Object.fromEntries(newAddresses));
  };

  const addAddressOptimistically = (newUnit: unitDetails) => {
    const newAddresses = new Map(addressesRef.current);
    newAddresses.set(newUnit.id, newUnit);
    setAddresses(newAddresses);
    void saveAddressCache(cacheKey, Object.fromEntries(newAddresses));
  };

  const handleSubscription = (data: {
    action: string;
    record: RecordModel;
  }) => {
    const addressId = data.record.id;
    const dataAction = data.action;
    const prev = addressesRef.current;

    let newAddresses: Map<string, unitDetails>;
    if (dataAction === "delete") {
      if (!prev.has(addressId)) return;
      newAddresses = new Map(prev);
      newAddresses.delete(addressId);
    } else {
      // If this address has a pending local write, skip the server update so the
      // optimistic value stays visible. fetchAddressData after mm-flush-complete
      // will apply the confirmed server state once the op is drained.
      if (pendingAddressIds.has(addressId)) return;
      // Address events don't carry expand data — preserve existing type from state.
      // Type changes come via the address_options subscription instead.
      const existingType = prev.get(addressId)?.type ?? [];
      newAddresses = new Map(prev);
      newAddresses.set(addressId, {
        ...createUnitDetails(data.record),
        type: existingType
      });
    }

    setAddresses(newAddresses);
    void saveAddressCache(cacheKey, Object.fromEntries(newAddresses));
  };

  const handleAddressOptionsSubscription = (data: {
    action: string;
    record: RecordModel;
  }) => {
    const addressId = data.record.address as string;
    const optionId = data.record.option as string;
    const dataAction = data.action;
    const prev = addressesRef.current;

    if (!prev.has(addressId)) return;

    // If this address has a pending local write, skip the server type change so
    // the optimistic badge state stays visible until the op is flushed.
    if (pendingAddressIds.has(addressId)) return;

    const unit = prev.get(addressId)!;
    let newType: typeof unit.type;

    if (dataAction === "create") {
      if (unit.type.some((t) => t.id === optionId)) return;
      newType = [
        ...unit.type,
        {
          id: optionId,
          code: options.get(optionId)?.code ?? "",
          aoId: data.record.id
        }
      ];
    } else if (dataAction === "delete") {
      const filtered = unit.type.filter((t) => t.id !== optionId);
      if (filtered.length === unit.type.length) return;
      newType = filtered;
    } else {
      return;
    }

    const newAddresses = new Map(prev);
    newAddresses.set(addressId, { ...unit, type: newType });
    setAddresses(newAddresses);
    void saveAddressCache(cacheKey, Object.fromEntries(newAddresses));
  };

  const onReconnect = useEffectEvent(() => {
    fetchAddressData();
    // Mirror Firestore/RxDB's transport-coupled flush: SSE reconnect is a strong
    // signal the connection is back. Trigger an immediate health check (via
    // useNetworkStatus) and a direct flush attempt (via useSmartSync) so pending
    // ops go out as soon as possible — without waiting for the 30s polling tick.
    window.dispatchEvent(new CustomEvent("mm-sse-reconnect"));
  });

  const onFlushComplete = useEffectEvent(() => {
    // Re-fetch after smart sync queue is flushed so the cache reflects the
    // post-write server state. PB_CONNECT may have cached stale data if it
    // fired before batch.send() committed (race condition on reconnect).
    fetchAddressData();
  });

  useEffect(() => {
    fetchAddressData();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes fetchAddressData
  }, [mapId]);

  useEffect(() => {
    window.addEventListener("mm-flush-complete", onFlushComplete);
    return () =>
      window.removeEventListener("mm-flush-complete", onFlushComplete);
  }, []);

  // Refresh data whenever the SSE connection (re)establishes — covers network drops
  // and cold starts. PB_CONNECT fires only on genuine reconnects.
  useEffect(() => {
    if (!mapId) return;

    let isCleaned = false;
    let unsubscribe: (() => void) | undefined;

    pb.realtime.subscribe("PB_CONNECT", onReconnect).then((unsub) => {
      if (isCleaned) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    });

    return () => {
      isCleaned = true;
      if (unsubscribe) unsubscribe();
    };
  }, [mapId]);

  useOnTabFocus(fetchAddressData);

  useRealtimeSubscription(
    "addresses",
    handleSubscription,
    {
      filter: `map="${mapId}"`,
      fields: PB_FIELDS.ADDRESSES_SUBSCRIPTION,
      ...(assignmentId && {
        headers: {
          [PB_SECURITY_HEADER_KEY]: assignmentId
        }
      })
    },
    [mapId, assignmentId],
    !!mapId,
    REALTIME_DEBOUNCE_MS
  );

  useRealtimeSubscription(
    "address_options",
    handleAddressOptionsSubscription,
    {
      // filter scopes events server-side to current map only (requires listRule on address_options)
      filter: `map="${mapId}"`,
      fields: PB_FIELDS.ADDRESS_OPTIONS,
      ...(assignmentId && {
        headers: {
          [PB_SECURITY_HEADER_KEY]: assignmentId
        }
      })
    },
    [mapId, assignmentId],
    !!mapId,
    REALTIME_DEBOUNCE_MS
  );

  return { addresses, updateAddressOptimistically, addAddressOptimistically };
};

const MainTable = ({
  policy,
  addressDetails,
  mapView = false,
  assignmentId,
  territoryId
}: territoryTableProps) => {
  const mapId = addressDetails?.id;
  const mapName = addressDetails?.name;
  const mapType = addressDetails?.type;
  const { t } = useTranslation();
  const { notifyError, notifyWarning } = useNotification();
  const { showModal } = useModalManagement();
  const { confirm } = useConfirm();
  const {
    pendingAddressIds,
    displayPendingAddressIds,
    writeUpdate,
    writeCreate
  } = useSmartSyncContext();
  const { addresses, updateAddressOptimistically, addAddressOptimistically } =
    useAddresses(mapId, policy.getOptionMap(), assignmentId, pendingAddressIds);

  const onOpDiscarded = useEffectEvent((e: Event) => {
    const count = (e as CustomEvent<{ count: number }>).detail.count;
    notifyWarning(
      t(
        "smartSync.discardedOps",
        "{{count}} edit(s) could not be saved and were discarded.",
        { count }
      )
    );
  });

  const onAuthExpired = useEffectEvent(() => {
    notifyWarning(
      t(
        "smartSync.authExpired",
        "Your session expired. Please sign in again — your offline edits are saved locally."
      )
    );
  });

  const onIdbBlocked = useEffectEvent(() => {
    notifyWarning(
      t(
        "smartSync.idbBlocked",
        "App update pending. Please close other open tabs to continue."
      )
    );
  });

  useEffect(() => {
    window.addEventListener("mm-op-discarded", onOpDiscarded);
    window.addEventListener("mm-auth-expired", onAuthExpired);
    window.addEventListener("mm-idb-blocked", onIdbBlocked);
    return () => {
      window.removeEventListener("mm-op-discarded", onOpDiscarded);
      window.removeEventListener("mm-auth-expired", onAuthExpired);
      window.removeEventListener("mm-idb-blocked", onIdbBlocked);
    };
  }, []);

  const onUpgradeLostOps = useEffectEvent(() => {
    const lost = consumeUpgradeLostOpsWarning();
    if (lost > 0) {
      notifyWarning(
        t(
          "smartSync.upgradeLostOps",
          "{{count}} offline edit(s) could not be carried over after an app update. Please re-enter them.",
          { count: lost }
        )
      );
    }
  });

  useEffect(() => {
    onUpgradeLostOps();
  }, []);

  const deleteAddressFloor = async (floor: number) => {
    try {
      await callFunction("/map/floor/remove", {
        method: "POST",
        body: {
          map: mapId,
          floor: floor
        }
      });
    } catch (error) {
      notifyError(error);
    }
  };

  const handleUpdateUnitStatus = (unitDetails?: unitDetails) => {
    if (!unitDetails) return;
    showModal(UpdateUnitStatus, {
      addressData: addressDetails,
      unitDetails,
      policy: policy,
      writeUpdate,
      onOptimisticUpdate: updateAddressOptimistically
    });
  };

  const getIdFromEvent = (event: React.MouseEvent<HTMLElement>) => {
    return event.currentTarget.dataset.id;
  };

  const getUnitDetails = (
    event: React.MouseEvent<HTMLElement>,
    addresses: Map<string, unitDetails>
  ) => {
    const id = getIdFromEvent(event) || "";
    return addresses.get(id);
  };

  const handleFloorDelete = async (floor: number) => {
    const confirmDelete = await confirm({
      title: t("common.confirmDelete", "Confirm Delete"),
      message: t(
        "address.deleteFloorWarning",
        'Floor {{floor}} and all its units will be permanently deleted from "{{name}}".\nYou cannot undo this.',
        {
          floor: floor,
          name: mapName
        }
      ),
      confirmText: t("common.delete", "Delete"),
      variant: "danger"
    });

    if (confirmDelete) {
      deleteAddressFloor(floor);
    }
  };

  const deleteAddressUnit = async (unitNumber: string) => {
    try {
      await callFunction("/map/code/delete", {
        method: "POST",
        body: {
          map: mapId,
          code: unitNumber
        }
      });
    } catch (error) {
      notifyError(error);
    }
  };

  const handleUnitDelete = async (unitNumber: string) => {
    const confirmDelete = await confirm({
      title: t("common.confirmDelete", "Confirm Delete"),
      message: t(
        "unit.confirmDelete",
        "Unit {{unitNo}} will be permanently deleted.\nYou cannot undo this.",
        {
          unitNo: unitNumber,
          mapName: mapName
        }
      ),
      confirmText: t("common.delete", "Delete"),
      variant: "danger"
    });

    if (confirmDelete) {
      deleteAddressUnit(unitNumber);
    }
  };

  const organizeAddresses = (
    addresses: Map<string, unitDetails>
  ): { floorList: floorDetails[]; maxUnitLength: number } => {
    if (addresses.size === 0) {
      return { floorList: [], maxUnitLength: DEFAULT_UNIT_PADDING };
    }

    let maxUnitLength = DEFAULT_UNIT_PADDING;

    const floorMap = new Map<number, unitDetails[]>();

    // Single pass to group by floor and track maxUnitLength
    for (const address of addresses.values()) {
      const { floor, number } = address;
      maxUnitLength = Math.max(maxUnitLength, number.length);

      if (!floorMap.has(floor)) {
        floorMap.set(floor, []);
      }
      floorMap.get(floor)!.push(address);
    }

    const floorList: floorDetails[] = Array.from(floorMap.entries())
      .map(([floor, units]) => ({
        floor,
        units: units.sort((a, b) => a.sequence - b.sequence)
      }))
      .sort((a, b) => b.floor - a.floor);

    return { floorList, maxUnitLength };
  };

  const handleHouseUpdate = (event: React.MouseEvent<HTMLElement>) => {
    handleUpdateUnitStatus(getUnitDetails(event, addresses));
  };

  const handleAddMoreClick = () => {
    const nextSequence = getNextSequence(
      Array.from(addresses.values()).map((u) => u.sequence)
    );
    showModal(CreateAddress, {
      addressData: addressDetails,
      policy,
      sequence: nextSequence,
      existingCodes: new Set(
        Array.from(addresses.values()).map((u) => u.number)
      ),
      territoryId: territoryId,
      writeCreate,
      onOptimisticCreate: addAddressOptimistically
    });
  };

  const handleFloorDeleteEvent = (event: React.MouseEvent<HTMLElement>) => {
    const { floor } = event.currentTarget.dataset;
    handleFloorDelete(Number(floor));
  };

  const { floorList, maxUnitLength } = organizeAddresses(addresses);

  const handleUnitDeleteEvent = (event: React.MouseEvent<HTMLElement>) => {
    const { unitno } = event.currentTarget.dataset;
    const totalUnits = floorList.reduce(
      (sum, floor) => sum + floor.units.length,
      0
    );
    if (totalUnits === 1) {
      notifyWarning(t("unit.requireOneUnitValidation"));
      return;
    }
    handleUnitDelete(unitno || "");
  };
  if (floorList.length === 0) {
    return <MapPlaceholder policy={policy} />;
  }
  if (mapType == TERRITORY_TYPES.SINGLE_STORY) {
    if (mapView) {
      return (
        <Suspense fallback={<MapPlaceholder policy={policy} />}>
          <TerritoryMapView
            addressDetails={addressDetails}
            houses={floorList[0] || []}
            policy={policy}
            handleHouseUpdate={handleHouseUpdate}
          />
        </Suspense>
      );
    }
    return (
      <PrivateTerritoryTable
        addressDetails={addressDetails}
        houses={floorList[0] || []}
        handleHouseUpdate={handleHouseUpdate}
        handleAddMoreClick={handleAddMoreClick}
        policy={policy}
        pendingAddressIds={displayPendingAddressIds}
      />
    );
  }

  return (
    <PublicTerritoryTable
      floors={floorList}
      policy={policy}
      addressDetails={addressDetails}
      maxUnitLength={maxUnitLength}
      handleUnitStatusUpdate={handleHouseUpdate}
      handleFloorDelete={handleFloorDeleteEvent}
      handleUnitDelete={handleUnitDeleteEvent}
      pendingAddressIds={displayPendingAddressIds}
    />
  );
};

export default MainTable;
