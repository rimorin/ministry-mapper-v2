import { Button, Card, Container } from "react-bootstrap";
import {
  TERRITORY_TYPES,
  USER_ACCESS_LEVELS,
  NOT_HOME_STATUS_CODES,
  WIKI_CATEGORIES,
  DEFAULT_FLOOR_PADDING,
  DEFAULT_UNIT_PADDING
} from "../../utils/constants";
import {
  floorDetails,
  territoryTableProps,
  unitDetails
} from "../../utils/interface";
import ModalManager from "@ebay/nice-modal-react";
import PrivateTerritoryTable from "./privatetable";
import { lazy, memo, useCallback, useEffect, useMemo, useState } from "react";
import { pb } from "../../pocketbase";
import SuspenseComponent from "../utils/suspense";
import ZeroPad from "../../utils/helpers/zeropad";
import { confirmAlert } from "react-confirm-alert";
import HelpButton from "../navigation/help";
import PublicTerritoryTable from "./publictable";
import { RecordModel } from "pocketbase";
import TerritoryMapView from "./mapmode";
const UpdateUnitStatus = lazy(() => import("../modal/updatestatus"));
const UpdateUnit = lazy(() => import("../modal/updateunit"));

const MainTable = ({
  policy,
  addressDetails,
  mapView = false
}: territoryTableProps) => {
  const mapId = addressDetails?.id;

  const [addresses, setAddresses] = useState<Map<string, unitDetails>>(
    new Map()
  );

  const deleteAddressFloor = useCallback(async (floor: number) => {
    await pb.send("map/floor/remove", {
      method: "POST",
      body: {
        map: mapId,
        floor: floor
      }
    });
  }, []);

  const updateAddressCode = async (
    addressId: string,
    mapId: string,
    maxUnitLength: number
  ) => {
    if (policy?.userRole !== USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE) return;
    const unitDetails = addresses?.get(addressId);
    const unitNo = unitDetails?.number || "";
    const sequence = unitDetails?.sequence;
    ModalManager.show(SuspenseComponent(UpdateUnit), {
      mapId: mapId,
      unitNo: unitNo || "",
      unitLength: Number(length),
      unitSequence: sequence === undefined ? undefined : Number(sequence),
      unitDisplay: ZeroPad(unitNo, maxUnitLength)
    });
  };

  const updateUnitStatus = async (
    floor: number,
    addressId: string,
    maxUnitLength: number
  ) => {
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
        publisherName: "user.displayName",
        policy: policy
      });
    } catch (error) {
      console.error("Error updating unit status", error);
    }
  };

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
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <Container>
            <Card bg="warning" className="text-center">
              <Card.Header>
                Warning ⚠️
                <HelpButton
                  link={WIKI_CATEGORIES.DELETE_ADDRESS_FLOOR}
                  isWarningButton={true}
                />
              </Card.Header>
              <Card.Body>
                <Card.Title>Are You Very Sure ?</Card.Title>
                <Card.Text>
                  This action will delete floor {`${floor}`} of{" "}
                  {addressDetails?.name}.
                </Card.Text>
                <Button
                  className="m-1"
                  variant="primary"
                  onClick={() => {
                    deleteAddressFloor(floor);
                    onClose();
                  }}
                >
                  Yes, Delete It.
                </Button>
                <Button
                  className="no-confirm-btn"
                  variant="primary"
                  onClick={() => {
                    onClose();
                  }}
                >
                  No
                </Button>
              </Card.Body>
            </Card>
          </Container>
        );
      }
    });
  }, []);

  const createUnitDetails = (address: RecordModel) => ({
    id: address.id,
    coordinates: address.coordinates,
    number: address.code,
    note: address.notes,
    type: address.expand?.type,
    status: address.status,
    nhcount: address.not_home_tries || NOT_HOME_STATUS_CODES.DEFAULT,
    dnctime: address.dnctime || null,
    sequence: address.sequence,
    floor: address.floor
  });

  const organizeAddresses = (
    addresses: Map<string, unitDetails>
  ): { floorList: floorDetails[]; maxUnitLength: number } => {
    if (addresses.size === 0) {
      return { floorList: [], maxUnitLength: DEFAULT_UNIT_PADDING };
    }

    let maxUnitLength = DEFAULT_UNIT_PADDING;
    const floorMap = Array.from(addresses.values()).reduce((map, address) => {
      const { floor, number } = address;
      if (number.length > maxUnitLength) {
        maxUnitLength = number.length;
      }
      if (!map.has(floor)) {
        map.set(floor, { floor, units: [] });
      }
      map.get(floor)?.units.push(address);
      return map;
    }, new Map<number, floorDetails>());

    // Sort units within each floor
    floorMap.forEach((floorDetails) => {
      floorDetails.units.sort((a, b) => a.sequence - b.sequence);
    });

    // Convert floorMap to an array and sort by floor
    const floorList = Array.from(floorMap.values()).sort(
      (a, b) => b.floor - a.floor
    );

    return { floorList, maxUnitLength };
  };

  useEffect(() => {
    const fetchAddressData = async () => {
      const addresses = await pb.collection("addresses").getFullList({
        filter: `map="${mapId}"`,
        expand: "type",
        requestKey: `addresses-${mapId}`
      });

      const addressMap = new Map();

      addresses.forEach((address) => {
        addressMap.set(address.id, createUnitDetails(address));
      });

      setAddresses(addressMap);
    };

    pb.collection("addresses").subscribe(
      "*",
      async (data) => {
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
      {
        filter: `map="${mapId}"`,
        expand: "type",
        requestKey: `subscription-${mapId}`
      }
    );

    fetchAddressData();
  }, [mapId]);

  const { floorList, maxUnitLength } = useMemo(
    () => organizeAddresses(addresses),
    [addresses]
  );
  if (floorList.length === 0) {
    return <div className="text-center p-2">Loading...</div>;
  }
  if (addressDetails?.type == TERRITORY_TYPES.SINGLE_STORY) {
    if (mapView) {
      return (
        <TerritoryMapView
          mapCoordinates={addressDetails.coordinates}
          mapId={mapId}
          houses={floorList[0] || []}
          aggregates={addressDetails.aggregates}
          policy={policy}
          handleHouseUpdate={(event) => handleHouseUpdate(event, maxUnitLength)}
        />
      );
    }
    return (
      <PrivateTerritoryTable
        mapId={mapId}
        houses={floorList[0] || []}
        aggregates={addressDetails.aggregates}
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
