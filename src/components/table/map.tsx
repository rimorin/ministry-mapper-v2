import React, { lazy, useEffect, useState } from "react";
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
  unitDetails
} from "../../utils/interface";
import PrivateTerritoryTable from "./privatetable";
import PublicTerritoryTable from "./publictable";
import TerritoryMapView from "./mapmode";
import useNotification from "../../hooks/useNotification";
import MapPlaceholder from "../statics/placeholder";

import useVisibilityChange from "../../hooks/useVisibilityManagement";
import { RecordModel } from "pocketbase";
import { getList, callFunction } from "../../utils/pocketbase";
import { useTranslation } from "react-i18next";
import { useModalManagement } from "../../hooks/useModalManagement";
import useRealtimeSubscription from "../../hooks/useRealtime";
const UpdateUnitStatus = lazy(() => import("../modal/updatestatus"));

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
    type: Array.isArray(address.type)
      ? address.type.map((type: string) => ({
          id: type,
          code: options.get(type)?.code ?? ""
        }))
      : [],
    status: address.status,
    nhcount: address.not_home_tries ?? NOT_HOME_STATUS_CODES.DEFAULT,
    dnctime: address.dnc_time ?? null,
    sequence: address.sequence,
    floor: address.floor,
    updated: address.updated,
    updatedBy: address.updated_by
  });

  const fetchAddressData = async () => {
    if (!mapId) return;
    const addresses = await getList("addresses", {
      filter: `map="${mapId}"`,
      requestKey: null,
      fields: PB_FIELDS.ADDRESSES
    });

    const addressMap = new Map();
    addresses.forEach((address) => {
      addressMap.set(address.id, createUnitDetails(address));
    });

    setAddresses(addressMap);
  };

  const handleSubscription = (data: {
    action: string;
    record: RecordModel;
  }) => {
    const addressId = data.record.id;
    const addressData = data.record;
    const dataAction = data.action;
    setAddresses((prev) => {
      const newAddresses = new Map(prev);
      if (dataAction === "update" || dataAction === "create") {
        newAddresses.set(addressId, createUnitDetails(addressData));
      } else if (dataAction === "delete") {
        newAddresses.delete(addressId);
      }
      return newAddresses;
    });
  };

  useEffect(() => {
    fetchAddressData();
  }, [mapId]);

  useRealtimeSubscription(
    "addresses",
    handleSubscription,
    {
      filter: `map="${mapId}"`,
      fields: PB_FIELDS.ADDRESSES,
      ...(assignmentId && {
        headers: {
          [PB_SECURITY_HEADER_KEY]: assignmentId
        }
      })
    },
    [mapId, assignmentId]
  );
  useVisibilityChange(fetchAddressData);

  return addresses;
};

const MainTable = ({
  policy,
  addressDetails,
  mapView = false,
  assignmentId
}: territoryTableProps) => {
  const mapId = addressDetails?.id;
  const mapName = addressDetails?.name;
  const mapType = addressDetails?.type;
  const { t } = useTranslation();
  const { notifyError, notifyWarning } = useNotification();
  const { showModal } = useModalManagement();
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
    const confirmDelete = window.confirm(
      t(
        "address.deleteFloorWarning",
        '⚠️ WARNING: Deleting floor {{floor}} of "{{name}}". This action cannot be undone. Proceed?',
        {
          floor: floor,
          name: mapName
        }
      )
    );

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
    const confirmDelete = window.confirm(
      t("unit.confirmDelete", 'Delete unit {{unitNo}} from "{{mapName}}"?', {
        unitNo: unitNumber,
        mapName: mapName
      })
    );

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
        <TerritoryMapView
          addressDetails={addressDetails}
          houses={floorList[0] || []}
          policy={policy}
          handleHouseUpdate={handleHouseUpdate}
        />
      );
    }
    return (
      <PrivateTerritoryTable
        addressDetails={addressDetails}
        houses={floorList[0] || []}
        handleHouseUpdate={handleHouseUpdate}
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
