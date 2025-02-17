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
import { pb } from "../../utils/pocketbase";
import {
  addressDetails,
  DropDirection,
  DropDirections
} from "../../utils/interface";
import { Policy } from "../../utils/policies";

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
                        {mapViews.get(currentMapId) ? "List View" : "Map View"}
                      </Button>
                    )}

                    <AssignmentButtonGroup
                      addressElement={addressElement}
                      policy={policy}
                      userId={pb.authStore?.record?.id as string}
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
                      Direction
                    </Button>
                    <MessageButtonGroup
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
                            Address
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
                                origin: policy.origin
                              }
                            )
                          }
                        >
                          Change Location
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
                          Change Map Number
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
                          Change Territory
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
                          Rename
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
                          Add{" "}
                          {addressElement.type === TERRITORY_TYPES.SINGLE_STORY
                            ? "Property"
                            : "Unit"}{" "}
                          No.
                        </Dropdown.Item>
                        {(!addressElement.type ||
                          addressElement.type ===
                            TERRITORY_TYPES.MULTIPLE_STORIES) && (
                          <Dropdown.Item
                            onClick={() => {
                              addFloorToMap(currentMapId, true);
                            }}
                          >
                            Add Higher Floor
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
                            Add Lower Floor
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item
                          onClick={() => {
                            const confirmReset = window.confirm(
                              `⚠️ WARNING: Resetting all property statuses of "${currentMapName}" will reset all statuses. This action cannot be undone. Proceed?`
                            );

                            if (confirmReset) {
                              resetMap(currentMapId);
                            }
                          }}
                        >
                          Reset Status
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            const confirmDelete = window.confirm(
                              `⚠️ WARNING: Deleting map "${currentMapName}" will remove it completely. This action cannot be undone. Proceed?`
                            );

                            if (confirmDelete) {
                              deleteMap(currentMapId, currentMapName, true);
                            }
                          }}
                        >
                          Delete
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
