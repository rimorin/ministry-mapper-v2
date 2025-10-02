import React, { lazy, useCallback, useState, useEffect, useMemo } from "react";
import { Container, Navbar, ProgressBar, Spinner } from "react-bootstrap";
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
  latlongInterface,
  MapListingProps,
  MapRowProps
} from "../../utils/interface";

import { useTranslation } from "react-i18next";
import { useModalManagement } from "../../hooks/useModalManagement";
import GenericButton from "./button";
import { GenericDropdownButton, GenericDropdownItem } from "./dropdownbutton";
import { List, type RowComponentProps } from "react-window";
import "../../css/virtualmaps.css";

const GetMapGeolocation = lazy(() => import("../modal/getlocation"));
const ChangeMapGeoLocation = lazy(() => import("../modal/changegeolocation"));
const ChangeMapCode = lazy(() => import("../modal/changemapcd"));
const ChangeAddressName = lazy(() => import("../modal/changeaddname"));
const NewUnit = lazy(() => import("../modal/newunit"));
const ChangeMapSequence = lazy(() => import("../modal/sequenceupdate"));

function MapRow({
  index,
  style,
  sortedAddressList,
  mapViews,
  processingMap,
  policy,
  userAccessLevel,
  accordingKeys,
  isReadonly,
  dropDirections,
  handlers,
  t
}: RowComponentProps<MapRowProps>) {
  const addressElement = sortedAddressList[index];
  const {
    handleDropdownDirection,
    handleToggleMapView,
    handleShowGetLocation,
    handleShowChangeLocation,
    handleShowChangeMapCode,
    handleChangeTerritory,
    handleShowChangeName,
    handleShowAddUnit,
    handleAddHigherFloor,
    handleAddLowerFloor,
    handleResetMap,
    handleDeleteMap,
    handleToggleMapExpansion,
    handleSequenceUpdate
  } = handlers;

  const {
    id: mapId,
    mapId: mapCode,
    name: mapName,
    type: mapType
  } = addressElement;
  const completeValue =
    addressElement.aggregates?.value || DEFAULT_AGGREGATES.value;
  const completedPercent =
    addressElement.aggregates?.display || DEFAULT_AGGREGATES.display;
  const isExpanded = accordingKeys.includes(mapId);

  return (
    <div className="map-item border-0" style={style}>
      {/* Map header */}
      <div
        className={`map-header ${isReadonly ? "" : "cursor-pointer"}`}
        onClick={
          !isReadonly ? () => handleToggleMapExpansion(mapId) : undefined
        }
        style={{ cursor: isReadonly ? "default" : "pointer" }}
      >
        <button
          className={`map-toggle-button ${isExpanded ? "" : "collapsed"}`}
          type="button"
          disabled={isReadonly}
        >
          <span
            className="fluid-bolding fluid-text"
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {mapName}
          </span>
        </button>
      </div>

      {/* Map content */}
      {(isExpanded || isReadonly) && (
        <div className="map-content collapse show">
          <div className="map-content-body p-0">
            <ProgressBar
              style={{ borderRadius: 0 }}
              now={completeValue}
              label={completedPercent}
            />
            <Navbar bg="light" expand="lg" key={`navbar-${mapId}`}>
              <Container fluid className="justify-content-end">
                {mapType === TERRITORY_TYPES.SINGLE_STORY && (
                  <GenericButton
                    size="sm"
                    variant="outline-primary"
                    className="m-1"
                    onClick={() => handleToggleMapView(mapId)}
                    label={
                      mapViews.get(mapId)
                        ? t("navigation.listView", "List View")
                        : t("navigation.mapView", "Map View")
                    }
                  />
                )}

                <AssignmentButtonGroup
                  key={`assignment-btn-${mapId}`}
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
                  key={`message-btn-${mapId}`}
                  addressElement={addressElement}
                  policy={policy}
                />
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
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
                          processingMap.mapId === mapId && (
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
                    drop={dropDirections[mapId]}
                    onClick={(e) => handleDropdownDirection(e, mapId)}
                  >
                    <GenericDropdownItem
                      onClick={() =>
                        handleShowChangeLocation(
                          mapId,
                          mapName,
                          addressElement.coordinates
                        )
                      }
                    >
                      {t("address.changeLocation", "Change Location")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      onClick={() => handleShowChangeMapCode(mapId, mapCode)}
                    >
                      {t("address.changeMapNumber", "Change Map Number")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      onClick={() => handleChangeTerritory(mapId, mapName)}
                    >
                      {t("address.changeTerritory", "Change Territory")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      onClick={() => handleSequenceUpdate(mapId)}
                    >
                      {t("address.changeSequence", "Change Sequence")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      onClick={() => handleShowChangeName(mapId, mapName)}
                    >
                      {t("address.changeName", "Rename")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      onClick={() => handleShowAddUnit(mapId, addressElement)}
                    >
                      {mapType === TERRITORY_TYPES.SINGLE_STORY
                        ? t("address.addProperty", "Add Property No.")
                        : t("address.addUnit", "Add Unit No.")}
                    </GenericDropdownItem>
                    {(!mapType ||
                      mapType === TERRITORY_TYPES.MULTIPLE_STORIES) && (
                      <>
                        <GenericDropdownItem
                          onClick={() => handleAddHigherFloor(mapId)}
                        >
                          {t("address.addHigherFloor", "Add Higher Floor")}
                        </GenericDropdownItem>
                        <GenericDropdownItem
                          onClick={() => handleAddLowerFloor(mapId)}
                        >
                          {t("address.addLowerFloor", "Add Lower Floor")}
                        </GenericDropdownItem>
                      </>
                    )}
                    <GenericDropdownItem
                      onClick={() => handleResetMap(mapId, mapName)}
                    >
                      {t("address.resetStatus", "Reset Status")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      onClick={() => handleDeleteMap(mapId, mapName)}
                    >
                      {t("address.delete", "Delete")}
                    </GenericDropdownItem>
                  </GenericDropdownButton>
                </ComponentAuthorizer>
              </Container>
            </Navbar>
            <MainTable
              mapView={mapViews.get(mapId)}
              key={`table-${mapId}`}
              policy={policy}
              addressDetails={addressElement}
            />
          </div>
        </div>
      )}
    </div>
  );
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
  const { showModal } = useModalManagement();
  const [dropDirections, setDropDirections] = useState<DropDirections>({});
  const [screenSize, setScreenSize] = useState<"sm" | "md" | "lg">("lg");

  // Track screen size for responsive height calculations
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setScreenSize("sm");
      } else if (width <= 768) {
        setScreenSize("md");
      } else {
        setScreenSize("lg");
      }
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    window.addEventListener("orientationchange", updateScreenSize);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
      window.removeEventListener("orientationchange", updateScreenSize);
    };
  }, []);

  // Calculate row height based on expansion state
  const getRowHeight = useCallback(
    (index: number): number => {
      const addressElement = sortedAddressList[index];
      if (!addressElement) return getHeaderHeight();

      const isExpanded = accordingKeys.includes(addressElement.id);
      return !isExpanded && !isReadonly
        ? getHeaderHeight()
        : calculateExpandedHeight();
    },
    [accordingKeys, isReadonly, sortedAddressList, screenSize]
  );

  const getHeaderHeight = useCallback((): number => {
    switch (screenSize) {
      case "sm":
        return 48;
      case "md":
        return 52;
      default:
        return 58;
    }
  }, [screenSize]);

  const calculateExpandedHeight = useCallback((): number => {
    const headerHeight = getHeaderHeight();
    const progressBarHeight = 6;
    const navbarHeight =
      screenSize === "sm" ? 44 : screenSize === "md" ? 48 : 56;

    const getFixedTableHeight = (): number => {
      switch (screenSize) {
        case "sm":
          return 420;
        case "md":
          return 450;
        default:
          return 500;
      }
    };

    const contentPadding =
      screenSize === "sm" ? 16 : screenSize === "md" ? 14 : 12;

    return (
      headerHeight +
      progressBarHeight +
      navbarHeight +
      getFixedTableHeight() +
      contentPadding
    );
  }, [getHeaderHeight, screenSize]);

  // Event handlers
  const handleDropdownDirection = useCallback(
    (
      event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>,
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

  const handleToggleMapView = useCallback(
    (mapId: string) => {
      setMapViews((prev) => {
        const updatedMapViews = new Map(prev);
        updatedMapViews.set(mapId, !updatedMapViews.get(mapId));
        return updatedMapViews;
      });
    },
    [setMapViews]
  );

  const handleShowGetLocation = useCallback(
    (addressElement: addressDetails) => {
      showModal(GetMapGeolocation, {
        coordinates: addressElement.coordinates,
        name: addressElement.name,
        origin: policy.origin
      });
    },
    [policy.origin, showModal]
  );

  const handleShowChangeLocation = useCallback(
    (mapId: string, currentMapName: string, coordinates: latlongInterface) => {
      showModal(ChangeMapGeoLocation, {
        footerSaveAcl: userAccessLevel,
        mapId,
        coordinates,
        origin: policy.origin,
        name: currentMapName
      });
    },
    [policy.origin, showModal, userAccessLevel]
  );

  const handleShowChangeMapCode = useCallback(
    (mapId: string, mapCode: string) => {
      showModal(ChangeMapCode, {
        footerSaveAcl: userAccessLevel,
        mapId,
        mapCode
      });
    },
    [showModal, userAccessLevel]
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
    [setValues, values, toggleAddressTerritoryListing]
  );

  const handleShowChangeName = useCallback(
    (mapId: string, mapName: string) => {
      showModal(ChangeAddressName, {
        footerSaveAcl: userAccessLevel,
        mapId,
        name: mapName
      });
    },
    [showModal, userAccessLevel]
  );

  const handleShowAddUnit = useCallback(
    (mapId: string, addressElement: addressDetails) => {
      showModal(NewUnit, {
        footerSaveAcl: userAccessLevel,
        mapId,
        addressData: addressElement
      });
    },
    [showModal, userAccessLevel]
  );

  const handleAddHigherFloor = useCallback(
    (mapId: string) => {
      addFloorToMap(mapId, true);
    },
    [addFloorToMap]
  );

  const handleAddLowerFloor = useCallback(
    (mapId: string) => {
      addFloorToMap(mapId);
    },
    [addFloorToMap]
  );

  const handleResetMap = useCallback(
    (mapId: string, mapName: string) => {
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
    },
    [resetMap, t]
  );

  const handleDeleteMap = useCallback(
    (mapId: string, mapName: string) => {
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
    },
    [deleteMap, t]
  );

  const handleToggleMapExpansion = useCallback(
    (mapId: string) => {
      setAccordionKeys((prevKeys) => {
        if (prevKeys.includes(mapId)) {
          return prevKeys.filter((key) => key !== mapId);
        } else {
          return [...prevKeys, mapId];
        }
      });
    },
    [setAccordionKeys]
  );

  const handleSequenceUpdate = useCallback(
    (mapId: string) => {
      showModal(ChangeMapSequence, {
        footerSaveAcl: userAccessLevel,
        mapId
      });
    },
    [showModal, userAccessLevel]
  );

  const rowProps = useMemo(
    () => ({
      sortedAddressList,
      mapViews,
      processingMap,
      policy,
      userAccessLevel,
      accordingKeys,
      isReadonly,
      dropDirections,
      handlers: {
        handleDropdownDirection,
        handleToggleMapView,
        handleShowGetLocation,
        handleShowChangeLocation,
        handleShowChangeMapCode,
        handleChangeTerritory,
        handleShowChangeName,
        handleShowAddUnit,
        handleAddHigherFloor,
        handleAddLowerFloor,
        handleResetMap,
        handleDeleteMap,
        handleToggleMapExpansion,
        handleSequenceUpdate
      },
      t
    }),
    [
      sortedAddressList,
      mapViews,
      processingMap,
      policy,
      userAccessLevel,
      accordingKeys,
      isReadonly,
      dropDirections,
      handleDropdownDirection,
      handleToggleMapView,
      handleShowGetLocation,
      handleShowChangeLocation,
      handleShowChangeMapCode,
      handleChangeTerritory,
      handleShowChangeName,
      handleShowAddUnit,
      handleAddHigherFloor,
      handleAddLowerFloor,
      handleResetMap,
      handleDeleteMap,
      handleToggleMapExpansion,
      handleSequenceUpdate,
      t
    ]
  );

  return (
    <List
      className="virtual-map-container map-container-flush"
      style={{ height: "80dvh" }}
      rowCount={sortedAddressList.length}
      rowHeight={getRowHeight}
      rowComponent={MapRow}
      rowProps={rowProps}
      overscanCount={2}
    />
  );
};

export default MapListing;
