import React, { lazy, useCallback, useEffect, useState } from "react";
import {
  TERRITORY_TYPES,
  USER_ACCESS_LEVELS,
  NOT_HOME_STATUS_CODES,
  DEFAULT_UNIT_PADDING,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS
} from "../../utils/constants";
import {
  floorDetails,
  territoryTableProps,
  unitDetails
} from "../../utils/interface";
import PrivateTerritoryTable from "./privatetable";
import PublicTerritoryTable from "./publictable";
import TerritoryMapView from "./mapmode";
import errorHandler from "../../utils/helpers/errorhandler";

import useVisibilityChange from "../utils/visibilitychange";
import { RecordModel, RecordSubscribeOptions } from "pocketbase";
import {
  getList,
  setupRealtimeListener,
  callFunction
} from "../../utils/pocketbase";
import { useTranslation } from "react-i18next";
import modalManagement from "../../hooks/modalManagement";
const UpdateUnitStatus = lazy(() => import("../modal/updatestatus"));
const UpdateUnit = lazy(() => import("../modal/updateunit"));

const useAddresses = (mapId: string, assignmentId?: string) => {
  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );

  const createUnitDetails = useCallback(
    (address: RecordModel) => ({
      id: address.id,
      coordinates: address.coordinates,
      number: address.code,
      note: address.notes,
      type: address.expand?.type,
      status: address.status,
      nhcount: address.not_home_tries || NOT_HOME_STATUS_CODES.DEFAULT,
      dnctime: address.dnctime || null,
      sequence: address.sequence,
      floor: address.floor,
      updated: address.updated,
      updatedBy: address.updated_by
    }),
    []
  );

  const fetchAddressData = useCallback(async () => {
    if (!mapId) return;
    const addresses = await getList("addresses", {
      filter: `map="${mapId}"`,
      expand: "type",
      requestKey: null,
      fields: PB_FIELDS.ADDRESSES
    });

    const addressMap = new Map();

    addresses.forEach((address) => {
      addressMap.set(address.id, createUnitDetails(address));
    });

    setAddresses(addressMap);
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;
    const subOptions = {
      filter: `map="${mapId}"`,
      expand: "type",
      requestKey: null,
      fields: PB_FIELDS.ADDRESSES
    } as RecordSubscribeOptions;

    if (assignmentId) {
      subOptions["headers"] = {
        [PB_SECURITY_HEADER_KEY]: assignmentId
      };
    }

    setupRealtimeListener(
      "addresses",
      (data) => {
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
      },
      subOptions
    );

    fetchAddressData();
  }, [mapId]);

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
  const userRole = policy?.userRole || USER_ACCESS_LEVELS.PUBLISHER.CODE;
  const mapType = addressDetails?.type;
  const { t } = useTranslation();
  const { showModal } = modalManagement();
  const addresses = useAddresses(mapId, assignmentId);

  const deleteAddressFloor = useCallback(
    async (floor: number) => {
      try {
        await callFunction("/map/floor/remove", {
          method: "POST",
          body: {
            map: mapId,
            floor: floor
          }
        });
      } catch (error) {
        errorHandler(error);
      }
    },
    [mapId]
  );

  const handleEditUnit = useCallback(
    (addressId: string) => {
      showModal(UpdateUnit, {
        addressId,
        mapId,
        footerSaveAcl: userRole,
        unitType: mapType
      });
    },
    [mapType, userRole, mapId]
  );

  const handleUpdateUnitStatus = useCallback(
    (unitDetails?: unitDetails) => {
      if (!unitDetails) return;
      showModal(UpdateUnitStatus, {
        addressData: addressDetails,
        unitDetails,
        policy: policy
      });
    },
    [addressDetails, policy]
  );

  const getIdFromEvent = useCallback(
    (event: google.maps.MapMouseEvent | React.MouseEvent<HTMLElement>) => {
      if ("domEvent" in event) {
        // event is a GoogleMapMouseEvent
        const domEvent = event.domEvent.target as HTMLElement;
        return domEvent.dataset.id;
      }
      // event is a React.MouseEvent
      return event.currentTarget.dataset.id;
    },
    []
  );

  const getUnitDetails = useCallback(
    (
      event: google.maps.MapMouseEvent | React.MouseEvent<HTMLElement>,
      addresses: Map<string, unitDetails>
    ) => {
      const id = getIdFromEvent(event) || "";
      return addresses.get(id);
    },
    [getIdFromEvent]
  );

  const handleFloorDelete = useCallback(
    async (floor: number) => {
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
    },
    [mapName]
  );

  const organizeAddresses = useCallback(
    (
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
    },
    []
  );

  const { floorList, maxUnitLength } = organizeAddresses(addresses);
  if (floorList.length === 0) {
    return <div className="text-center p-2">Loading...</div>;
  }
  if (mapType == TERRITORY_TYPES.SINGLE_STORY) {
    if (mapView) {
      return (
        <TerritoryMapView
          addressDetails={addressDetails}
          houses={floorList[0] || []}
          policy={policy}
          handleHouseUpdate={(event) =>
            handleUpdateUnitStatus(getUnitDetails(event, addresses))
          }
        />
      );
    }
    return (
      <PrivateTerritoryTable
        addressDetails={addressDetails}
        houses={floorList[0] || []}
        handleHouseUpdate={(event) =>
          handleUpdateUnitStatus(getUnitDetails(event, addresses))
        }
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
      handleUnitStatusUpdate={(event) =>
        handleUpdateUnitStatus(getUnitDetails(event, addresses))
      }
      handleFloorDelete={(event) => {
        const { floor } = event.currentTarget.dataset;
        handleFloorDelete(Number(floor));
      }}
      handleUnitNoUpdate={(event) =>
        handleEditUnit(getUnitDetails(event, addresses)?.id || "")
      }
    />
  );
};

export default MainTable;
