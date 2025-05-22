import React, { lazy, MouseEvent, useCallback, useState } from "react";
import {
  Accordion,
  Container,
  Navbar,
  ProgressBar,
  Spinner
} from "react-bootstrap";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  DEFAULT_AGGREGATES
} from "../../utils/constants";
import AssignmentButtonGroup from "./assignmentbtn";
import MessageButtonGroup from "./messagebtn";
import ComponentAuthorizer from "./authorizer";
import MainTable from "../table/map";
import { getUser } from "../../utils/pocketbase";
import {
  addressDetails,
  DropDirection,
  DropDirections,
  latlongInterface
} from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { useTranslation } from "react-i18next";
import modalManagement from "../../hooks/modalManagement";
import GenericButton from "./button";
import { GenericDropdownButton, GenericDropdownItem } from "./dropdownbutton";

const GetMapGeolocation = lazy(() => import("../modal/getlocation"));
const ChangeMapGeoLocation = lazy(() => import("../modal/changegeolocation"));
const ChangeMapCode = lazy(() => import("../modal/changemapcd"));
const ChangeAddressName = lazy(() => import("../modal/changeaddname"));
const NewUnit = lazy(() => import("../modal/newunit"));

interface MapListingProps {
  sortedAddressList: addressDetails[];
  mapViews: Map<string, boolean>;
  setMapViews: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
  processingMap: { isProcessing: boolean; mapId: string | null };
  policy: Policy;
  userAccessLevel: string;
  setValues: React.Dispatch<React.SetStateAction<object>>;
  toggleAddressTerritoryListing: () => void;
  addFloorToMap: (mapId: string, higherFloor?: boolean) => Promise<void>;
  resetMap: (mapId: string) => Promise<void>;
  deleteMap: (mapId: string, name: string, showAlert: boolean) => Promise<void>;
  values: object;
  accordingKeys: string[];
  setAccordionKeys: React.Dispatch<React.SetStateAction<string[]>>;
  isReadonly: boolean;
}

const MapListing: React.FC<MapListingProps> = ({
  sortedAddressList,
  mapViews,
  setMapViews,
  processingMap,
  policy,
  userAccessLevel,
  setValues,
  toggleAddressTerritoryListing,
  addFloorToMap,
  resetMap,
  deleteMap,
  values,
  accordingKeys,
  setAccordionKeys,
  isReadonly
}) => {
  const { t } = useTranslation();
  const { showModal } = modalManagement();
  const [dropDirections, setDropDirections] = useState<DropDirections>({});
  const policyOrigin = policy.origin;

  const handleDropdownDirection = useCallback(
    (
      event: MouseEvent<HTMLElement, globalThis.MouseEvent>,
      dropdownId: string
    ) => {
      const clickPositionY = event.clientY;
      const dropdownHeight = 300;
      const windowInnerHeight = window.innerHeight;

      let dropdownDirection: DropDirection = "down";
      if (windowInnerHeight - clickPositionY < dropdownHeight) {
        dropdownDirection = "up";
      }
      setDropDirections((prev) => ({
        ...prev,
        [dropdownId]: dropdownDirection
      }));
    },
    []
  );

  const handleToggleMapView = useCallback((mapId: string) => {
    setMapViews((prev) => {
      const updatedMapViews = new Map(prev);
      updatedMapViews.set(mapId, !updatedMapViews.get(mapId));
      return updatedMapViews;
    });
  }, []);

  const handleShowGetLocation = useCallback(
    (addressElement: addressDetails) => {
      showModal(GetMapGeolocation, {
        coordinates: addressElement.coordinates,
        name: addressElement.name,
        origin: policyOrigin
      });
    },
    [policyOrigin]
  );

  const handleShowChangeLocation = useCallback(
    (mapId: string, currentMapName: string, coordinates: latlongInterface) => {
      showModal(ChangeMapGeoLocation, {
        footerSaveAcl: userAccessLevel,
        mapId,
        coordinates,
        origin: policyOrigin,
        name: currentMapName
      });
    },
    [policyOrigin]
  );

  const handleShowChangeMapCode = useCallback(
    (mapId: string, mapCode: string) => {
      showModal(ChangeMapCode, {
        footerSaveAcl: userAccessLevel,
        mapId,
        mapCode
      });
    },
    []
  );

  const handleChangeTerritory = useCallback(
    (mapId: string, mapName: string) => {
      setValues({
        ...values,
        map: mapId,
        name: mapName
      });
      toggleAddressTerritoryListing();
    },
    []
  );

  const handleShowChangeName = useCallback((mapId: string, mapName: string) => {
    showModal(ChangeAddressName, {
      footerSaveAcl: userAccessLevel,
      mapId,
      name: mapName
    });
  }, []);

  const handleShowAddUnit = useCallback(
    (mapId: string, addressElement: addressDetails) => {
      showModal(NewUnit, {
        footerSaveAcl: userAccessLevel,
        mapId,
        addressData: addressElement
      });
    },
    []
  );

  const handleAddHigherFloor = useCallback((mapId: string) => {
    addFloorToMap(mapId, true);
  }, []);

  const handleAddLowerFloor = useCallback(
    (mapId: string) => {
      addFloorToMap(mapId);
    },
    [addFloorToMap]
  );

  const handleResetMap = useCallback((mapId: string, mapName: string) => {
    const confirmReset = window.confirm(
      t(
        "address.resetWarning",
        '⚠️ WARNING: Resetting all property statuses of "{{name}}" will reset all statuses. This action cannot be undone. Proceed?',
        { name: mapName }
      )
    );

    if (confirmReset) {
      resetMap(mapId);
    }
  }, []);

  const handleDeleteMap = useCallback((mapId: string, mapName: string) => {
    const confirmDelete = window.confirm(
      t(
        "address.deleteWarning",
        '⚠️ WARNING: Deleting map "{{name}}" will remove it completely. This action cannot be undone. Proceed?',
        { name: mapName }
      )
    );

    if (confirmDelete) {
      deleteMap(mapId, mapName, true);
    }
  }, []);

  return (
    <Accordion
      activeKey={isReadonly ? undefined : accordingKeys}
      onSelect={(eventKeys) => {
        if (Array.isArray(eventKeys)) {
          setAccordionKeys(
            eventKeys.map((key) => {
              return key.toString();
            })
          );
        }
      }}
      alwaysOpen={!isReadonly}
      flush
    >
      {sortedAddressList.map((addressElement) => {
        const currentMapId = addressElement.id;
        const currentMapCode = addressElement.mapId;
        const currentMapName = addressElement.name;
        const currentMapType = addressElement.type;
        const completeValue =
          addressElement.aggregates?.value || DEFAULT_AGGREGATES.value;
        const completedPercent =
          addressElement.aggregates?.display || DEFAULT_AGGREGATES.display;
        return (
          <Accordion.Item
            key={`accordion-${currentMapId}`}
            eventKey={currentMapId}
          >
            <Accordion.Header>
              <span className="fluid-bolding fluid-text">{currentMapName}</span>
            </Accordion.Header>
            <Accordion.Body className="p-0">
              <ProgressBar
                style={{ borderRadius: 0 }}
                now={completeValue}
                label={completedPercent}
              />
              <div key={`div-${currentMapId}`}>
                <Navbar bg="light" expand="lg" key={`navbar-${currentMapId}`}>
                  <Container fluid className="justify-content-end">
                    {currentMapType === TERRITORY_TYPES.SINGLE_STORY && (
                      <GenericButton
                        size="sm"
                        variant="outline-primary"
                        className="m-1"
                        onClick={() => handleToggleMapView(currentMapId)}
                        label={
                          mapViews.get(currentMapId)
                            ? t("navigation.listView", "List View")
                            : t("navigation.mapView", "Map View")
                        }
                      />
                    )}

                    <AssignmentButtonGroup
                      key={`assignment-btn-${currentMapId}`}
                      addressElement={addressElement}
                      policy={policy}
                      userId={getUser("id") as string}
                    />
                    <GenericButton
                      size="sm"
                      variant="outline-primary"
                      className="m-1"
                      onClick={() => handleShowGetLocation(addressElement)}
                      label={t("navigation.direction", "Direction")}
                    />
                    <MessageButtonGroup
                      key={`message-btn-${currentMapId}`}
                      addressElement={addressElement}
                      policy={policy}
                    />
                    <ComponentAuthorizer
                      requiredPermission={
                        USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                      }
                      userPermission={userAccessLevel}
                    >
                      <GenericDropdownButton
                        className="dropdown-btn"
                        align="end"
                        variant="outline-primary"
                        size="sm"
                        label={
                          <>
                            {processingMap.isProcessing &&
                              processingMap.mapId === currentMapId && (
                                <>
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    aria-hidden="true"
                                  />{" "}
                                </>
                              )}{" "}
                            {t("address.address", "Address")}
                          </>
                        }
                        drop={dropDirections[currentMapId]}
                        onClick={(e) =>
                          handleDropdownDirection(e, currentMapId)
                        }
                      >
                        <GenericDropdownItem
                          onClick={() =>
                            handleShowChangeLocation(
                              currentMapId,
                              currentMapName,
                              addressElement.coordinates
                            )
                          }
                        >
                          {t("address.changeLocation", "Change Location")}
                        </GenericDropdownItem>
                        <GenericDropdownItem
                          onClick={() =>
                            handleShowChangeMapCode(
                              currentMapId,
                              currentMapCode
                            )
                          }
                        >
                          {t("address.changeMapNumber", "Change Map Number")}
                        </GenericDropdownItem>
                        <GenericDropdownItem
                          onClick={() =>
                            handleChangeTerritory(currentMapId, currentMapName)
                          }
                        >
                          {t("address.changeTerritory", "Change Territory")}
                        </GenericDropdownItem>
                        <GenericDropdownItem
                          onClick={() =>
                            handleShowChangeName(currentMapId, currentMapName)
                          }
                        >
                          {t("address.changeName", "Rename")}
                        </GenericDropdownItem>
                        <GenericDropdownItem
                          onClick={() =>
                            handleShowAddUnit(currentMapId, addressElement)
                          }
                        >
                          {t(
                            addressElement.type === TERRITORY_TYPES.SINGLE_STORY
                              ? "address.addProperty"
                              : "address.addUnit",
                            addressElement.type === TERRITORY_TYPES.SINGLE_STORY
                              ? "Add Property No."
                              : "Add Unit No."
                          )}
                        </GenericDropdownItem>
                        {(!addressElement.type ||
                          addressElement.type ===
                            TERRITORY_TYPES.MULTIPLE_STORIES) && (
                          <GenericDropdownItem
                            onClick={() => handleAddHigherFloor(currentMapId)}
                          >
                            {t("address.addHigherFloor", "Add Higher Floor")}
                          </GenericDropdownItem>
                        )}
                        {(!addressElement.type ||
                          addressElement.type ===
                            TERRITORY_TYPES.MULTIPLE_STORIES) && (
                          <GenericDropdownItem
                            onClick={() => handleAddLowerFloor(currentMapId)}
                          >
                            {t("address.addLowerFloor", "Add Lower Floor")}
                          </GenericDropdownItem>
                        )}
                        <GenericDropdownItem
                          onClick={() =>
                            handleResetMap(currentMapId, currentMapName)
                          }
                        >
                          {t("address.resetStatus", "Reset Status")}
                        </GenericDropdownItem>
                        <GenericDropdownItem
                          onClick={() =>
                            handleDeleteMap(currentMapId, currentMapName)
                          }
                        >
                          {t("address.delete", "Delete")}
                        </GenericDropdownItem>
                      </GenericDropdownButton>
                    </ComponentAuthorizer>
                  </Container>
                </Navbar>
                <MainTable
                  mapView={mapViews.get(currentMapId)}
                  key={`table-${currentMapId}`}
                  policy={policy}
                  addressDetails={addressElement}
                />
              </div>
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default MapListing;
