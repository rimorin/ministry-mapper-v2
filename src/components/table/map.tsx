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
  applyAddressEvent,
  applyAddressOptionsEvent,
  RealtimeEvent
} from "../../utils/helpers/addressReducers";
import {
  saveAddressCache,
  loadAddressCache,
  getQueue,
  applyOpTypes
} from "../../utils/smartsync";
import { useTranslation } from "react-i18next";
import { useModalManagement } from "../../hooks/useModalManagement";
import useRealtimeSubscription from "../../hooks/useRealtime";
import useOnTabFocus from "../../hooks/useOnTabFocus";
import { useSmartSyncContext } from "../../hooks/useSmartSync";
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
      coordinates: op.updateData.coordinates
        ? (JSON.parse(op.updateData.coordinates) as {
            lat: number;
            lng: number;
          })
        : base.coordinates,
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

  const cacheKey = assignmentId ?? mapId;
  // Read inside the cache-persistence effect so a cacheKey change alone (e.g.
  // mapId switch) does not write the *old* map's data under the *new* key
  // before the new fetch lands.
  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;

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
      // Cache persistence is centralized in the effect below.
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
    setAddresses((prev) => {
      const existing = prev.get(addressId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(addressId, {
        ...existing,
        status: updateData.status,
        note: updateData.notes,
        nhcount: String(updateData.not_home_tries),
        dnctime: updateData.dnc_time ? Date.parse(updateData.dnc_time) : 0,
        coordinates: updateData.coordinates
          ? (JSON.parse(updateData.coordinates) as { lat: number; lng: number })
          : existing.coordinates,
        type: newTypes
      });
      return next;
    });
  };

  const addAddressOptimistically = (newUnit: unitDetails) => {
    setAddresses((prev) => {
      const next = new Map(prev);
      next.set(newUnit.id, newUnit);
      return next;
    });
  };

  // Functional updater so bursts of events (e.g. reset-all) compose against
  // the latest queued state, not a render-stale snapshot. Each event would
  // otherwise read the same `prev` and the last setAddresses would win,
  // dropping intermediate updates. Merge logic lives in addressReducers.ts.
  const handleSubscription = (data: RealtimeEvent) => {
    setAddresses((prev) => applyAddressEvent(prev, data, pendingAddressIds));
  };

  const handleAddressOptionsSubscription = (data: RealtimeEvent) => {
    setAddresses((prev) =>
      applyAddressOptionsEvent(prev, data, pendingAddressIds, options)
    );
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

  // Persist `addresses` to IndexedDB whenever it changes. Centralizing the
  // write here (instead of inline at every setAddresses call site) coalesces
  // bursts of realtime events into a single write per render commit, and
  // keeps setState updaters pure (StrictMode-safe). cacheKey is read via ref
  // so that a mapId/assignmentId switch does not write the previous map's
  // data under the new key before the new fetch lands.
  useEffect(() => {
    if (addresses.size === 0) return;
    void saveAddressCache(cacheKeyRef.current, Object.fromEntries(addresses));
  }, [addresses]);

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
  const { notifyWarning, runAction } = useNotification();
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

  const deleteAddressFloor = async (floor: number) => {
    await runAction(async () => {
      await callFunction("/map/floor/remove", {
        method: "POST",
        body: { map: mapId, floor }
      });
    });
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
    await runAction(async () => {
      await callFunction("/map/code/delete", {
        method: "POST",
        body: { map: mapId, code: unitNumber }
      });
    });
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
