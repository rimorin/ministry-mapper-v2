import React, { lazy, MouseEvent, useCallback, useState } from "react";
import {
  Accordion,
  Button,
  Container,
  Dropdown,
  DropdownButton,
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
import ModalManager from "@ebay/nice-modal-react";
import SuspenseComponent from "../utils/suspense";
import { getUser } from "../../utils/pocketbase";
import {
  addressDetails,
  DropDirection,
  DropDirections
} from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { useTranslation } from "react-i18next";

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
  const [dropDirections, setDropDirections] = useState<DropDirections>({});
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
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="m-1"
                        onClick={() => {
                          setMapViews((prev) => {
                            const updatedMapViews = new Map(prev);
                            updatedMapViews.set(
                              currentMapId,
                              !updatedMapViews.get(currentMapId)
                            );
                            return updatedMapViews;
                          });
                        }}
                      >
                        {mapViews.get(currentMapId)
                          ? t("navigation.listView", "List View")
                          : t("navigation.mapView", "Map View")}
                      </Button>
                    )}

                    <AssignmentButtonGroup
                      key={`assignment-btn-${currentMapId}`}
                      addressElement={addressElement}
                      policy={policy}
                      userId={getUser("id") as string}
                    />
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="m-1"
                      onClick={() => {
                        ModalManager.show(
                          SuspenseComponent(GetMapGeolocation),
                          {
                            coordinates: addressElement.coordinates,
                            name: currentMapName,
                            origin: policy.origin
                          }
                        );
                      }}
                    >
                      {t("navigation.direction", "Direction")}
                    </Button>
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
                      <DropdownButton
                        className="dropdown-btn"
                        align="end"
                        variant="outline-primary"
                        size="sm"
                        title={
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
                        <Dropdown.Item
                          onClick={() =>
                            ModalManager.show(
                              SuspenseComponent(ChangeMapGeoLocation),
                              {
                                footerSaveAcl: userAccessLevel,
                                mapId: currentMapId,
                                coordinates: addressElement.coordinates,
                                origin: policy.origin,
                                name: currentMapName
                              }
                            )
                          }
                        >
                          {t("address.changeLocation", "Change Location")}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            ModalManager.show(
                              SuspenseComponent(ChangeMapCode),
                              {
                                footerSaveAcl: userAccessLevel,
                                mapId: currentMapId,
                                mapCode: currentMapCode
                              }
                            )
                          }
                        >
                          {t("address.changeMapNumber", "Change Map Number")}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setValues({
                              ...values,
                              map: currentMapId,
                              name: currentMapName
                            });
                            toggleAddressTerritoryListing();
                          }}
                        >
                          {t("address.changeTerritory", "Change Territory")}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            ModalManager.show(
                              SuspenseComponent(ChangeAddressName),
                              {
                                footerSaveAcl: userAccessLevel,
                                mapId: currentMapId,
                                name: currentMapName
                              }
                            )
                          }
                        >
                          {t("address.changeName", "Rename")}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            ModalManager.show(SuspenseComponent(NewUnit), {
                              footerSaveAcl: userAccessLevel,
                              mapId: currentMapId,
                              addressData: addressElement
                            });
                          }}
                        >
                          {t(
                            addressElement.type === TERRITORY_TYPES.SINGLE_STORY
                              ? "address.addProperty"
                              : "address.addUnit",
                            addressElement.type === TERRITORY_TYPES.SINGLE_STORY
                              ? "Add Property No."
                              : "Add Unit No."
                          )}
                        </Dropdown.Item>
                        {(!addressElement.type ||
                          addressElement.type ===
                            TERRITORY_TYPES.MULTIPLE_STORIES) && (
                          <Dropdown.Item
                            onClick={() => {
                              addFloorToMap(currentMapId, true);
                            }}
                          >
                            {t("address.addHigherFloor", "Add Higher Floor")}
                          </Dropdown.Item>
                        )}
                        {(!addressElement.type ||
                          addressElement.type ===
                            TERRITORY_TYPES.MULTIPLE_STORIES) && (
                          <Dropdown.Item
                            onClick={() => {
                              addFloorToMap(currentMapId);
                            }}
                          >
                            {t("address.addLowerFloor", "Add Lower Floor")}
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item
                          onClick={() => {
                            const confirmReset = window.confirm(
                              t(
                                "address.resetWarning",
                                '⚠️ WARNING: Resetting all property statuses of "{{name}}" will reset all statuses. This action cannot be undone. Proceed?',
                                { name: currentMapName }
                              )
                            );

                            if (confirmReset) {
                              resetMap(currentMapId);
                            }
                          }}
                        >
                          {t("address.resetStatus", "Reset Status")}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            const confirmDelete = window.confirm(
                              t(
                                "address.deleteWarning",
                                '⚠️ WARNING: Deleting map "{{name}}" will remove it completely. This action cannot be undone. Proceed?',
                                { name: currentMapName }
                              )
                            );

                            if (confirmDelete) {
                              deleteMap(currentMapId, currentMapName, true);
                            }
                          }}
                        >
                          {t("address.delete", "Delete")}
                        </Dropdown.Item>
                      </DropdownButton>
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
