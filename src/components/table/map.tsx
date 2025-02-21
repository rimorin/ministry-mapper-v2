import {
  TERRITORY_TYPES,
  USER_ACCESS_LEVELS,
  NOT_HOME_STATUS_CODES,
  DEFAULT_FLOOR_PADDING,
  DEFAULT_UNIT_PADDING,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS
} from "../../utils/constants";
import {
  floorDetails,
  territoryTableProps,
  unitDetails
} from "../../utils/interface";
import ModalManager from "@ebay/nice-modal-react";
import PrivateTerritoryTable from "./privatetable";
import { lazy, useCallback, useEffect, useState } from "react";
import { pb } from "../../utils/pocketbase";
import SuspenseComponent from "../utils/suspense";
import ZeroPad from "../../utils/helpers/zeropad";
import PublicTerritoryTable from "./publictable";
import { RecordModel, RecordSubscribeOptions } from "pocketbase";
import TerritoryMapView from "./mapmode";
import errorHandler from "../../utils/helpers/errorhandler";
import { useRollbar } from "@rollbar/react";
import useVisibilityChange from "../utils/visibilitychange";
const UpdateUnitStatus = lazy(() => import("../modal/updatestatus"));
const UpdateUnit = lazy(() => import("../modal/updateunit"));

const MainTable = ({
  policy,
  addressDetails,
  mapView = false,
  assignmentId
}: territoryTableProps) => {
  const mapId = addressDetails?.id;
  const mapName = addressDetails?.name;
  const rollbar = useRollbar();

  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );

  const deleteAddressFloor = useCallback(async (floor: number) => {
    try {
      await pb.send("map/floor/remove", {
        method: "POST",
        body: {
          map: mapId,
          floor: floor
        }
      });
    } catch (error) {
      errorHandler(error, rollbar);
    }
  }, []);

  const updateAddressCode = useCallback(
    async (unitDetails: unitDetails | undefined, maxUnitLength: number) => {
      if (!unitDetails) return;
      if (policy?.userRole !== USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE)
        return;
      const unitNo = unitDetails.number || "";
      const sequence = unitDetails.sequence;
      ModalManager.show(SuspenseComponent(UpdateUnit), {
        mapId: mapId,
        mapName: mapName,
        unitNo: unitNo || "",
        unitLength: Number(length),
        unitSequence: sequence === undefined ? undefined : Number(sequence),
        unitDisplay: ZeroPad(unitNo, maxUnitLength)
      });
    },
    []
  );

  const updateUnitStatus = useCallback(
    async (unitDetails: unitDetails | undefined, maxUnitLength: number) => {
      if (!unitDetails) return;
      try {
        ModalManager.show(SuspenseComponent(UpdateUnitStatus), {
          options: policy?.options,
          addressName: addressDetails?.name,
          userAccessLevel: policy?.userRole,
          territoryType: addressDetails?.type,
          congregation: addressDetails?.mapId,
          mapId,
          unitNo: unitDetails.number || "",
          unitNoDisplay: ZeroPad(unitDetails.number || "", maxUnitLength),
          floor: unitDetails.floor || 0,
          floorDisplay: ZeroPad(
            (unitDetails.floor || 0).toString(),
            DEFAULT_FLOOR_PADDING
          ),
          unitDetails,
          addressData: addressDetails,
          origin: policy?.origin,
          policy
        });
      } catch (error) {
        console.error("Error updating unit status", error);
      }
    },
    []
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
    []
  );

  const handleFloorDelete = useCallback(async (floor: number) => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Floor Deletion\n\nThis action will delete floor ${floor} of ${addressDetails?.name}.\n\nAre you sure you want to proceed?`
    );

    if (confirmDelete) {
      deleteAddressFloor(floor);
    }
  }, []);

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

  const fetchAddressData = useCallback(async (mapId: string) => {
    const addresses = await pb.collection("addresses").getFullList({
      filter: `map="${mapId}"`,
      expand: "type",
      requestKey: `addresses-${mapId}`,
      fields: PB_FIELDS.ADDRESSES
    });

    const addressMap = new Map();

    addresses.forEach((address) => {
      addressMap.set(address.id, createUnitDetails(address));
    });

    setAddresses(addressMap);
  }, []);

  useEffect(() => {
    if (!mapId) return;
    const subOptions = {
      filter: `map="${mapId}"`,
      expand: "type",
      requestKey: `addresses-sub-${mapId}`,
      fields: PB_FIELDS.ADDRESSES
    } as RecordSubscribeOptions;

    if (assignmentId) {
      subOptions["headers"] = {
        //  add PB_SECURITY_HEADER_KEY as key
        [PB_SECURITY_HEADER_KEY]: assignmentId
      };
    }

    pb.collection("addresses").subscribe(
      "*",
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

    fetchAddressData(mapId);
  }, []);
  useVisibilityChange(() => fetchAddressData(mapId));

  const { floorList, maxUnitLength } = organizeAddresses(addresses);
  if (floorList.length === 0) {
    return <div className="text-center p-2">Loading...</div>;
  }
  if (addressDetails?.type == TERRITORY_TYPES.SINGLE_STORY) {
    if (mapView) {
      return (
        <TerritoryMapView
          addressDetails={addressDetails}
          houses={floorList[0] || []}
          policy={policy}
          handleHouseUpdate={(event) =>
            updateUnitStatus(getUnitDetails(event, addresses), maxUnitLength)
          }
        />
      );
    }
    return (
      <PrivateTerritoryTable
        addressDetails={addressDetails}
        houses={floorList[0] || []}
        handleHouseUpdate={(event) =>
          updateUnitStatus(getUnitDetails(event, addresses), maxUnitLength)
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
        updateUnitStatus(getUnitDetails(event, addresses), maxUnitLength)
      }
      handleFloorDelete={(event) => {
        const { floor } = event.currentTarget.dataset;
        handleFloorDelete(Number(floor));
      }}
      handleUnitNoUpdate={(event) =>
        updateAddressCode(getUnitDetails(event, addresses), maxUnitLength)
      }
    />
  );
};

export default MainTable;
