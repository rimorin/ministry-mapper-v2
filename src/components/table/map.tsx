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
import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { pb } from "../../utils/pocketbase";
import SuspenseComponent from "../utils/suspense";
import ZeroPad from "../../utils/helpers/zeropad";
import PublicTerritoryTable from "./publictable";
import { RecordModel, RecordSubscribeOptions } from "pocketbase";
import TerritoryMapView from "./mapmode";
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

  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );
  const [maxUnitLength, setMaxUnitLength] = useState(DEFAULT_UNIT_PADDING);
  const [floorList, setFloorList] = useState<floorDetails[]>([]);

  const deleteAddressFloor = useCallback(async (floor: number) => {
    await pb.send("map/floor/remove", {
      method: "POST",
      body: {
        map: mapId,
        floor: floor
      }
    });
  }, []);

  const updateAddressCode = useCallback(
    async (addressId: string, mapId: string, maxUnitLength: number) => {
      if (policy?.userRole !== USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE)
        return;
      const unitDetails = addresses?.get(addressId);
      const unitNo = unitDetails?.number || "";
      const sequence = unitDetails?.sequence;
      ModalManager.show(SuspenseComponent(UpdateUnit), {
        mapId: mapId,
        mapName: mapName,
        unitNo: unitNo || "",
        unitLength: Number(length),
        unitSequence: sequence === undefined ? undefined : Number(sequence),
        unitDisplay: ZeroPad(unitNo, maxUnitLength)
      });
    },
    [addresses]
  );

  const updateUnitStatus = useCallback(
    async (floor: number, addressId: string, maxUnitLength: number) => {
      const unitDetails = addresses.get(addressId);
      const unitNo = unitDetails?.number || "";
      try {
        ModalManager.show(SuspenseComponent(UpdateUnitStatus), {
          options: policy?.options,
          addressName: addressDetails?.name,
          userAccessLevel: policy?.userRole,
          territoryType: addressDetails?.type,
          congregation: addressDetails?.mapId,
          mapId: addressDetails?.mapId,
          unitNo: unitNo,
          unitNoDisplay: ZeroPad(unitNo, maxUnitLength),
          floor: floor,
          floorDisplay: ZeroPad(floor.toString(), DEFAULT_FLOOR_PADDING),
          unitDetails: unitDetails,
          addressData: addressDetails,
          origin: policy?.origin,
          policy: policy
        });
      } catch (error) {
        console.error("Error updating unit status", error);
      }
    },
    [addresses]
  );

  const handleHouseUpdate = (
    event: React.MouseEvent<HTMLElement> | google.maps.MapMouseEvent,
    maxUnitLength: number
  ) => {
    let floor: string | undefined;
    let id: string | undefined;

    if ("domEvent" in event) {
      // event is a GoogleMapMouseEvent
      const domEvent = event.domEvent.target as HTMLElement;
      ({ floor, id } = domEvent.dataset);
    } else {
      // event is a React.MouseEvent
      ({ floor, id } = event.currentTarget.dataset);
    }

    if (floor && id) {
      updateUnitStatus(Number(floor), id, maxUnitLength);
    }
  };

  const handleFloorDelete = useCallback(async (floor: number) => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Floor Deletion\n\nThis action will delete floor ${floor} of ${addressDetails?.name}.\n\nAre you sure you want to proceed?`
    );

    if (confirmDelete) {
      deleteAddressFloor(floor);
    }
  }, []);

  const createUnitDetails = useMemo(
    () => (address: RecordModel) => ({
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

  useEffect(() => {
    const fetchAddressData = async () => {
      const addresses = await pb.collection("addresses").getFullList({
        filter: `map="${mapId}"`,
        expand: "type",
        sort: "-floor,sequence",
        fields: PB_FIELDS.GET_ADDRESSES,
        requestKey: `addresses-${mapId}`
      });

      let maxUnitLength = DEFAULT_UNIT_PADDING;

      const floorListing = [] as floorDetails[];
      let currentFloor = -1;
      let currentUnits = [] as unitDetails[];
      const addressMap = new Map<string, unitDetails>();

      addresses.forEach((address) => {
        const unitDetails = createUnitDetails(address);
        addressMap.set(address.id, unitDetails);

        const { floor, code } = address;
        if (floor !== currentFloor) {
          if (currentFloor !== -1) {
            floorListing.push({ floor: currentFloor, units: currentUnits });
          }
          currentFloor = floor;
          currentUnits = [];
        }

        currentUnits.push(unitDetails);
        maxUnitLength = Math.max(maxUnitLength, code.length);
      });

      // Add the last floor and its units
      if (currentFloor !== -1) {
        floorListing.push({ floor: currentFloor, units: currentUnits });
      }

      setFloorList(floorListing);
      setMaxUnitLength(maxUnitLength);
      setAddresses(addressMap);
    };

    const subOptions = {
      filter: `map="${mapId}"`,
      fields: PB_FIELDS.GET_ADDRESSES,
      expand: "type",
      requestKey: `addresses-sub-${mapId}`
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
          const { floorList, maxUnitLength } = organizeAddresses(newAddresses);
          setFloorList(floorList);
          setMaxUnitLength(maxUnitLength);

          return newAddresses;
        });
      },
      subOptions
    );

    fetchAddressData();
  }, []);

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
          handleHouseUpdate={(event) => handleHouseUpdate(event, maxUnitLength)}
        />
      );
    }
    return (
      <PrivateTerritoryTable
        addressDetails={addressDetails}
        houses={floorList[0] || []}
        handleHouseUpdate={(event) => handleHouseUpdate(event, maxUnitLength)}
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
      handleUnitStatusUpdate={(event) => {
        const { floor, id } = event.currentTarget.dataset;
        updateUnitStatus(Number(floor), id || "", maxUnitLength);
      }}
      handleFloorDelete={(event) => {
        const { floor } = event.currentTarget.dataset;
        handleFloorDelete(Number(floor));
      }}
      handleUnitNoUpdate={(event) => {
        const { id } = event.currentTarget.dataset;
        updateAddressCode(id || "", mapId, maxUnitLength);
      }}
    />
  );
};

export default MainTable;
