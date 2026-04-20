import React, {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useState
} from "react";
import {
  TERRITORY_TYPES,
  NOT_HOME_STATUS_CODES,
  DEFAULT_UNIT_PADDING,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS
} from "../../utils/constants";
import {
  floorDetails,
  HHOptionProps,
  territoryTableProps,
  unitDetails,
  mapAddressResponse
} from "../../utils/interface";
import PrivateTerritoryTable from "./privatetable";
import PublicTerritoryTable from "./publictable";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import MapPlaceholder from "../statics/placeholder";

import { callFunction, pb } from "../../utils/pocketbase";
import { useTranslation } from "react-i18next";
import { useModalManagement } from "../../hooks/useModalManagement";
import useRealtimeSubscription from "../../hooks/useRealtime";
import { RecordModel } from "pocketbase";
const TerritoryMapView = lazy(() => import("./mapmode"));
const UpdateUnitStatus = lazy(() => import("../modal/updatestatus"));
const CreateAddress = lazy(() => import("../modal/createaddress"));

const useAddresses = (
  mapId: string,
  options: Map<string, HHOptionProps>,
  assignmentId?: string
) => {
  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );

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

  const fetchAddressData = async () => {
    if (!mapId) return;
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

    setAddresses(addressMap);
  };

  const handleSubscription = (data: {
    action: string;
    record: RecordModel;
  }) => {
    const addressId = data.record.id;
    const dataAction = data.action;
    setAddresses((prev) => {
      if (dataAction === "delete") {
        if (!prev.has(addressId)) return prev; // bail out — already gone
        const newAddresses = new Map(prev);
        newAddresses.delete(addressId);
        return newAddresses;
      }
      // update or create
      // Address events don't carry expand data — preserve existing type from state.
      // Type changes come via the address_options subscription instead.
      const existingType = prev.get(addressId)?.type ?? [];
      const newAddresses = new Map(prev);
      newAddresses.set(addressId, {
        ...createUnitDetails(data.record),
        type: existingType
      });
      return newAddresses;
    });
  };

  const handleAddressOptionsSubscription = (data: {
    action: string;
    record: RecordModel;
  }) => {
    const addressId = data.record.address as string;
    const optionId = data.record.option as string;
    const dataAction = data.action;
    setAddresses((prev) => {
      if (!prev.has(addressId)) return prev;
      const unit = prev.get(addressId)!;
      let newType: typeof unit.type;

      if (dataAction === "create") {
        if (unit.type.some((t) => t.id === optionId)) return prev; // bail out — duplicate
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
        if (filtered.length === unit.type.length) return prev; // bail out — nothing removed
        newType = filtered;
      } else {
        return prev; // unknown action
      }

      const newAddresses = new Map(prev);
      newAddresses.set(addressId, { ...unit, type: newType });
      return newAddresses;
    });
  };

  const onReconnect = useEffectEvent(() => {
    fetchAddressData();
  });

  useEffect(() => {
    fetchAddressData();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes fetchAddressData
  }, [mapId]);

  // Refresh data whenever the SSE connection (re)establishes — covers network drops.
  // SSE stays alive in background tabs so events are processed continuously;
  // PB_CONNECT fires only on genuine reconnects (network drop, cold start).
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
    !!mapId
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
    !!mapId
  );

  return addresses;
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
  const addresses = useAddresses(mapId, policy.getOptionMap(), assignmentId);

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
      policy: policy
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

    // Use a Map to group units by floor
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

    // Convert to final format, sort floors and units
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
    showModal(CreateAddress, {
      addressData: addressDetails,
      policy,
      sequence: addresses.size,
      existingCodes: new Set(
        Array.from(addresses.values()).map((u) => u.number)
      ),
      territoryId: territoryId
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
    />
  );
};

export default MainTable;
