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
  unitColumn,
  unitDetails,
  mapAddressResponse
} from "../../utils/interface";
import PrivateTerritoryTable from "./privatetable";
import PublicTerritoryTable from "./publictable";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import MapPlaceholder from "../statics/placeholder";

import { callFunction, isAbortError } from "../../utils/pocketbase";
import {
  compareUnitNumbers,
  getNextSequence
} from "../../utils/helpers/maphelpers";
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
import useOnSSEReconnect from "../../hooks/useOnSSEReconnect";
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

// Window for coalescing realtime event bursts into a single state commit.
const REALTIME_EVENT_BATCH_MS = 100;
// Delay before persisting the address map to IndexedDB after a change.
const CACHE_WRITE_DEBOUNCE_MS = 300;

// Module-level default: an inline `new Set()` default parameter makes the
// React Compiler bail out of compiling the entire hook ("NewExpression cannot
// be safely reordered"), which would leave the returned mutators with
// unstable identities and defeat row-level render bail-outs downstream.
const EMPTY_PENDING_IDS: Set<string> = new Set();

const useAddresses = (
  mapId: string,
  options: Map<string, HHOptionProps>,
  assignmentId?: string,
  pendingAddressIds: Set<string> = EMPTY_PENDING_IDS,
  preloadedAddresses?: mapAddressResponse[]
) => {
  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );

  const cacheKey = assignmentId ?? mapId;
  // Read inside the cache-persistence effect so a cacheKey change alone (e.g.
  // mapId switch) does not write the *old* map's data under the *new* key
  // before the new fetch lands. Updated in an effect (not during render) to
  // stay within compiler rules; it is declared before the cache-persistence
  // effect, so it always runs first within the same commit.
  const cacheKeyRef = useRef(cacheKey);
  useEffect(() => {
    cacheKeyRef.current = cacheKey;
  });

  const optionCodeMap = new Map(
    [...options.entries()].map(([id, o]) => [id, o.code])
  );

  // Coalesce realtime event bursts into as few state commits as possible.
  // Bulk server operations (e.g. /map/reset) emit one SSE message per address
  // and each message lands in its own macrotask, so React cannot batch them —
  // without this, a 300-unit reset causes ~300 full re-renders of the unit
  // grid. The first event of a burst applies immediately (single events stay
  // instant); events arriving within the window are applied in one commit.
  // Appliers are pure reducers, so reducing a batch inside a functional
  // updater stays StrictMode-safe. Merge logic lives in addressReducers.ts.
  //
  // Ordering guarantees relative to direct setAddresses writes (matching the
  // pre-batching behavior, where every event applied immediately):
  // - Optimistic local writes flush the buffer first, so the user's write
  //   always lands after any earlier-arrived event.
  // - Full snapshots (fetch/cache) discard the buffer: events that arrived
  //   before the snapshot are already reflected in it.
  const pendingEventsRef = useRef<
    Array<(prev: Map<string, unitDetails>) => Map<string, unitDetails>>
  >([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingEvents = () => {
    const batch = pendingEventsRef.current;
    if (batch.length === 0) return;
    pendingEventsRef.current = [];
    setAddresses((prev) => batch.reduce((acc, fn) => fn(acc), prev));
  };

  const discardPendingEvents = () => {
    pendingEventsRef.current = [];
  };

  const applyEventBatched = (
    apply: (prev: Map<string, unitDetails>) => Map<string, unitDetails>
  ) => {
    if (flushTimerRef.current !== null) {
      pendingEventsRef.current.push(apply);
      return;
    }
    setAddresses(apply);
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flushPendingEvents();
    }, REALTIME_EVENT_BATCH_MS);
  };

  // Drop buffered events when the map changes or the component unmounts —
  // queued appliers belong to the previous subscription's data.
  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      pendingEventsRef.current = [];
    };
  }, [mapId]);

  const processAddressResponse = async (response: mapAddressResponse[]) => {
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
    // The snapshot supersedes any events buffered before it arrived —
    // replaying them on top would regress fresher data.
    discardPendingEvents();
    setAddresses(addressMap);
  };

  // Plain async closure, not ignoreAbort-wrapped: passing a ref-touching
  // closure to a non-hook function during render makes the React Compiler
  // bail out of the whole hook. Aborts are swallowed with an early return
  // instead (all call sites are fire-and-forget).
  const fetchAddressData = async () => {
    if (!mapId) return;
    try {
      const response = (await callFunction("/map/addresses", {
        method: "POST",
        body: { map_id: mapId },
        requestKey: `map-addresses-${mapId}`
      })) as mapAddressResponse[];

      await processAddressResponse(response);
      // Cache persistence is centralized in the effect below.
    } catch (error) {
      // Abort means a newer fetch superseded this one — skip the cache
      // fallback and let the newer request populate state.
      if (isAbortError(error)) return;
      const cached = await loadAddressCache(cacheKey);
      if (cached) {
        // Re-apply pending ops on top of the cached snapshot so the user sees
        // their queued edits, not the last-known server state.
        const cachedMap = new Map(Object.entries(cached.data));
        const pendingOps = await getQueue(mapId);
        applyPendingOpsToAddressMap(cachedMap, pendingOps, optionCodeMap);
        discardPendingEvents();
        setAddresses(cachedMap);
        return;
      }
    }
  };

  const updateAddressOptimistically = (
    addressId: string,
    updateData: QueuedOp["updateData"],
    newTypes: Array<{ id: string; code: string; aoId?: string }>
  ) => {
    // Apply buffered events first so the local write always lands last —
    // a buffered event captured a pendingAddressIds set from before this
    // write became pending and would otherwise clobber it.
    flushPendingEvents();
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
    flushPendingEvents();
    setAddresses((prev) => {
      const next = new Map(prev);
      next.set(newUnit.id, newUnit);
      return next;
    });
  };

  const handleSubscription = (data: RealtimeEvent) => {
    applyEventBatched((prev) =>
      applyAddressEvent(prev, data, pendingAddressIds)
    );
  };

  const handleAddressOptionsSubscription = (data: RealtimeEvent) => {
    applyEventBatched((prev) =>
      applyAddressOptionsEvent(prev, data, pendingAddressIds, options)
    );
  };

  useOnSSEReconnect(() => {
    fetchAddressData();
    // Mirror Firestore/RxDB's transport-coupled flush: SSE reconnect is a strong
    // signal the connection is back. Trigger an immediate health check (via
    // useNetworkStatus) and a direct flush attempt (via useSmartSync) so pending
    // ops go out as soon as possible — without waiting for the 30s polling tick.
    window.dispatchEvent(new CustomEvent("mm-sse-reconnect"));
  }, !!mapId);

  const onFlushComplete = useEffectEvent(() => {
    // Re-fetch after smart sync queue is flushed so the cache reflects the
    // post-write server state. PB_CONNECT may have cached stale data if it
    // fired before a write committed (race condition on reconnect).
    fetchAddressData();
  });

  useEffect(() => {
    if (preloadedAddresses !== undefined) {
      void processAddressResponse(preloadedAddresses);
    } else {
      fetchAddressData();
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes fetchAddressData
  }, [mapId]);

  useEffect(() => {
    window.addEventListener("mm-flush-complete", onFlushComplete);
    return () =>
      window.removeEventListener("mm-flush-complete", onFlushComplete);
  }, []);

  // Persist `addresses` to IndexedDB whenever it changes, debounced so a
  // burst of commits produces a single serialization + write instead of one
  // per commit. cacheKey is captured at schedule time (via ref, so that a
  // mapId/assignmentId switch does not write the previous map's data under
  // the new key before the new fetch lands). An unmount inside the window
  // drops one write — safe, because pending ops are overlaid on top of the
  // cached snapshot on next load.
  useEffect(() => {
    if (addresses.size === 0) return;
    const cacheWriteKey = cacheKeyRef.current;
    const timer = setTimeout(() => {
      void saveAddressCache(cacheWriteKey, Object.fromEntries(addresses));
    }, CACHE_WRITE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [addresses]);

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

const buildFloorList = (
  addresses: Map<string, unitDetails>,
  prevFloorList: floorDetails[],
  prevColumns: unitColumn[]
): {
  floorList: floorDetails[];
  maxUnitLength: number;
  columns: unitColumn[];
} => {
  if (addresses.size === 0) {
    return {
      floorList: [],
      maxUnitLength: DEFAULT_UNIT_PADDING,
      columns: []
    };
  }

  let maxUnitLength = DEFAULT_UNIT_PADDING;

  const floorMap = new Map<number, unitDetails[]>();
  // The column order is the union of units across every floor, not one floor's
  // list. A floor that orders or omits a unit differently must not be able to
  // shift its neighbours' cells under the wrong header. Keyed on
  // sequence+number so a map carrying the same unit number twice keeps both
  // columns instead of collapsing them into one.
  const columnSlots = new Map<string, { number: string; sequence: number }>();

  for (const address of addresses.values()) {
    const { floor, number, sequence } = address;
    maxUnitLength = Math.max(maxUnitLength, number.length);

    const slot = `${sequence} ${number}`;
    if (!columnSlots.has(slot)) {
      columnSlots.set(slot, { number, sequence });
    }

    if (!floorMap.has(floor)) {
      floorMap.set(floor, []);
    }
    floorMap.get(floor)!.push(address);
  }

  const occurrences = new Map<string, number>();
  const nextColumns: unitColumn[] = Array.from(columnSlots.values())
    .sort((a, b) => {
      const bySequence = a.sequence - b.sequence;
      return bySequence !== 0
        ? bySequence
        : compareUnitNumbers(a.number, b.number);
    })
    .map(({ number }) => {
      const occurrence = occurrences.get(number) ?? 0;
      occurrences.set(number, occurrence + 1);
      return { key: `${number}#${occurrence}`, number, occurrence };
    });

  // Reuse the previous array when the columns are unchanged so FloorRow keeps
  // bailing out of re-renders on realtime commits.
  const columns =
    prevColumns.length === nextColumns.length &&
    prevColumns.every((column, i) => column.key === nextColumns[i].key)
      ? prevColumns
      : nextColumns;

  const prevByFloor = new Map(prevFloorList.map((f) => [f.floor, f]));

  const floorList: floorDetails[] = Array.from(floorMap.entries())
    .map(([floor, units]) => {
      units.sort((a, b) => {
        const bySequence = a.sequence - b.sequence;
        return bySequence !== 0
          ? bySequence
          : compareUnitNumbers(a.number, b.number);
      });
      // Reuse the previous floor object when its units are identical (the
      // realtime reducers keep untouched unit objects referentially stable),
      // so unchanged rows bail out of re-rendering under the React Compiler.
      const prev = prevByFloor.get(floor);
      if (
        prev &&
        prev.units.length === units.length &&
        prev.units.every((unit, i) => unit === units[i])
      ) {
        return prev;
      }
      return { floor, units };
    })
    .sort((a, b) => b.floor - a.floor);

  return { floorList, maxUnitLength, columns };
};

// Derives the floor list from the address map with structural sharing.
// Uses React's "adjusting state when props change" render-phase pattern so
// the previous floor list is available without reading refs during render.
const useFloorList = (addresses: Map<string, unitDetails>) => {
  const [organized, setOrganized] = useState(() => ({
    addresses,
    ...buildFloorList(addresses, [], [])
  }));

  if (organized.addresses !== addresses) {
    setOrganized({
      addresses,
      ...buildFloorList(addresses, organized.floorList, organized.columns)
    });
  }

  return {
    floorList: organized.floorList,
    maxUnitLength: organized.maxUnitLength,
    columns: organized.columns
  };
};

const MainTable = ({
  policy,
  addressDetails,
  mapView = false,
  assignmentId,
  territoryId,
  preloadedAddresses
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
    useAddresses(
      mapId,
      policy.getOptionMap(),
      assignmentId,
      pendingAddressIds,
      preloadedAddresses
    );
  const { floorList, maxUnitLength, columns } = useFloorList(addresses);

  // Latest addresses for read-at-click-time handlers. Keeping `addresses`
  // out of the handlers' closures keeps their identity stable across
  // realtime commits, so unchanged table rows bail out of re-rendering.
  const addressesRef = useRef(addresses);
  useEffect(() => {
    addressesRef.current = addresses;
  });

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
        requestKey: `map-floor-remove-${mapId}-${floor}`,
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
        requestKey: `map-code-delete-${mapId}-${unitNumber}`,
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

  const handleHouseUpdate = (event: React.MouseEvent<HTMLElement>) => {
    handleUpdateUnitStatus(getUnitDetails(event, addressesRef.current));
  };

  const handleAddMoreClick = () => {
    const units = Array.from(addressesRef.current.values());
    const nextSequence = getNextSequence(units.map((u) => u.sequence));
    showModal(CreateAddress, {
      addressData: addressDetails,
      policy,
      sequence: nextSequence,
      existingCodes: new Set(units.map((u) => u.number)),
      territoryId: territoryId,
      writeCreate,
      onOptimisticCreate: addAddressOptimistically
    });
  };

  const handleFloorDeleteEvent = (event: React.MouseEvent<HTMLElement>) => {
    const { floor } = event.currentTarget.dataset;
    handleFloorDelete(Number(floor));
  };

  const handleUnitDeleteEvent = (event: React.MouseEvent<HTMLElement>) => {
    const { unitno } = event.currentTarget.dataset;
    if (addressesRef.current.size === 1) {
      notifyWarning(t("unit.requireOneUnitValidation"));
      return;
    }
    handleUnitDelete(unitno || "");
  };
  if (floorList.length === 0) {
    return <MapPlaceholder policy={policy} />;
  }

  return mapType == TERRITORY_TYPES.SINGLE_STORY ? (
    mapView ? (
      <Suspense fallback={<MapPlaceholder policy={policy} />}>
        <TerritoryMapView
          addressDetails={addressDetails}
          houses={floorList[0] || []}
          policy={policy}
          handleHouseUpdate={handleHouseUpdate}
        />
      </Suspense>
    ) : (
      <PrivateTerritoryTable
        addressDetails={addressDetails}
        houses={floorList[0] || []}
        handleHouseUpdate={handleHouseUpdate}
        handleAddMoreClick={handleAddMoreClick}
        policy={policy}
        pendingAddressIds={displayPendingAddressIds}
      />
    )
  ) : (
    <PublicTerritoryTable
      floors={floorList}
      columns={columns}
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
