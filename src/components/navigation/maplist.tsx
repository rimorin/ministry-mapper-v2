import React, { lazy, useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
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
import useConfirm from "../../hooks/useConfirm";
import AggregationBadge from "./aggrbadge";
import GenericButton from "./button";
import {
  GenericDropdownButton,
  GenericDropdownItem,
  GenericDropdownSeparator
} from "./dropdownbutton";
import {
  Navigation2,
  MapPin,
  FolderInput,
  ArrowUpDown,
  Pencil,
  Plus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Trash2
} from "lucide-react";
import { List, type RowComponentProps } from "react-window";
import useScrollPersistence from "../../hooks/useScrollPersistence";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";

import "../../css/virtualmaps.css";
const GetMapGeolocation = lazy(() => import("../modal/getlocation"));
const ChangeMapGeoLocation = lazy(() => import("../modal/changegeolocation"));

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
  dropDirections,
  territoryId,
  handlers,
  t
}: RowComponentProps<MapRowProps>) {
  const addressElement = sortedAddressList[index];
  const {
    handleDropdownDirection,
    handleToggleMapView,
    handleShowGetLocation,
    handleShowChangeLocation,
    handleChangeTerritory,
    handleShowChangeName,
    handleShowAddUnit,
    handleAddHigherFloor,
    handleAddLowerFloor,
    handleResetMap,
    handleDeleteMap,
    handleSequenceUpdate
  } = handlers;

  const { id: mapId, name: mapName, type: mapType } = addressElement;
  const completeValue =
    addressElement.aggregates?.value || DEFAULT_AGGREGATES.value;
  const notDoneCount = addressElement.aggregates?.notDone ?? 0;
  const notHomeCount = addressElement.aggregates?.notHome ?? 0;

  return (
    <div className="map-item border-0" style={style}>
      <div className="map-header" style={{ cursor: "default" }}>
        <button className="map-toggle-button" type="button" disabled>
          <span
            className="fluid-text tracking-tight text-foreground"
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {mapName}
          </span>
          {(notDoneCount > 0 || notHomeCount > 0) && (
            <span className="ml-3 grid shrink-0 grid-cols-[auto_auto] gap-x-2 whitespace-nowrap text-xs leading-tight text-muted-foreground">
              {notDoneCount > 0 && (
                <>
                  <span className="text-left">
                    {t("address.notDone", "Not Done")}
                  </span>
                  <span className="text-right tabular-nums">
                    {notDoneCount}
                  </span>
                </>
              )}
              {notHomeCount > 0 && (
                <>
                  <span className="text-left">
                    {t("address.notHome", "Not Home")}
                  </span>
                  <span className="text-right tabular-nums">
                    {notHomeCount}
                  </span>
                </>
              )}
            </span>
          )}
          <AggregationBadge
            aggregate={completeValue}
            size="lg"
            className="ml-2 shrink-0"
          />
        </button>
      </div>

      <div className="map-content">
        <div className="map-content-body p-0">
          <div className="flex flex-nowrap items-center justify-start gap-1 overflow-x-auto px-2 py-2 scrollbar-none">
            {mapType === TERRITORY_TYPES.SINGLE_STORY && (
              <GenericButton
                size="sm"
                variant="outline"
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
              variant="outline"
              onClick={() => handleShowGetLocation(addressElement)}
              label={
                <span className="flex items-center gap-1.5">
                  <Navigation2 className="size-3.5" />
                  {t("navigation.direction", "Direction")}
                </span>
              }
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
                align="end"
                variant="outline"
                size="sm"
                label={
                  <>
                    {processingMap.isProcessing &&
                      processingMap.mapId === mapId && (
                        <>
                          <Spinner
                            data-icon="inline-start"
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
                  icon={<MapPin className="size-4" />}
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
                  icon={<FolderInput className="size-4" />}
                  onClick={() => handleChangeTerritory(mapId, mapName)}
                >
                  {t("address.changeTerritory", "Change Territory")}
                </GenericDropdownItem>
                <GenericDropdownItem
                  icon={<ArrowUpDown className="size-4" />}
                  onClick={() => handleSequenceUpdate(mapId)}
                >
                  {t("address.changeSequence", "Change Sequence")}
                </GenericDropdownItem>
                <GenericDropdownItem
                  icon={<Pencil className="size-4" />}
                  onClick={() => handleShowChangeName(mapId, mapName)}
                >
                  {t("address.changeName", "Rename")}
                </GenericDropdownItem>
                <GenericDropdownItem
                  icon={<Plus className="size-4" />}
                  onClick={() => handleShowAddUnit(mapId, addressElement)}
                >
                  {mapType === TERRITORY_TYPES.SINGLE_STORY
                    ? t("address.addProperty", "Add Property No.")
                    : t("address.addUnit", "Add Unit No.")}
                </GenericDropdownItem>
                {(!mapType || mapType === TERRITORY_TYPES.MULTIPLE_STORIES) && (
                  <>
                    <GenericDropdownItem
                      icon={<ChevronUp className="size-4" />}
                      onClick={() => handleAddHigherFloor(mapId)}
                    >
                      {t("address.addHigherFloor", "Add Higher Floor")}
                    </GenericDropdownItem>
                    <GenericDropdownItem
                      icon={<ChevronDown className="size-4" />}
                      onClick={() => handleAddLowerFloor(mapId)}
                    >
                      {t("address.addLowerFloor", "Add Lower Floor")}
                    </GenericDropdownItem>
                  </>
                )}
                <GenericDropdownSeparator />
                <GenericDropdownItem
                  icon={<RotateCcw className="size-4" />}
                  onClick={() => handleResetMap(mapId, mapName)}
                >
                  {t("address.resetStatus", "Reset Status")}
                </GenericDropdownItem>
                <GenericDropdownItem
                  icon={<Trash2 className="size-4" />}
                  variant="destructive"
                  onClick={() => handleDeleteMap(mapId, mapName)}
                >
                  {t("address.delete", "Delete")}
                </GenericDropdownItem>
              </GenericDropdownButton>
            </ComponentAuthorizer>
          </div>
          <MainTable
            mapView={mapViews.get(mapId)}
            key={`table-${mapId}`}
            policy={policy}
            addressDetails={addressElement}
            territoryId={territoryId}
          />
        </div>
      </div>
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
  accordionKeys,
  setAccordionKeys,
  isReadonly,
  territoryId
}) => {
  const { t } = useTranslation();
  const { showModal } = useModalManagement();
  const { confirm } = useConfirm();
  const { trackEvent } = useAnalytics();
  const [dropDirections, setDropDirections] = useState<DropDirections>({});
  const [screenSize, setScreenSize] = useState<"xs" | "sm" | "md" | "lg">("lg");
  const { listRef, onScroll: handleScroll } = useScrollPersistence(territoryId);
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 430) {
        setScreenSize("xs");
      } else if (width <= 480) {
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

  const getHeaderHeight = (): number => {
    switch (screenSize) {
      case "xs":
      case "sm":
        return 48;
      case "md":
        return 52;
      default:
        return 58;
    }
  };

  const getAdminTableMaxHeight = (): number => {
    // Must match .map-body-admin height breakpoints in admin.css
    switch (screenSize) {
      case "xs":
        return 360;
      case "sm":
        return 400;
      case "md":
        return 450;
      default:
        return 490;
    }
  };

  const getRowHeight = (_: number): number => {
    const actionBarHeight = 52; // single-row nowrap: py-2 (16px) + btn height (32px) + 4px buffer
    const contentPadding = 8;

    const tableHeight = policy.isFromAdmin()
      ? getAdminTableMaxHeight()
      : (() => {
          switch (screenSize) {
            case "xs":
              return 390;
            case "sm":
              return 420;
            case "md":
              return 450;
            default:
              return 500;
          }
        })();

    return getHeaderHeight() + actionBarHeight + tableHeight + contentPadding;
  };

  const handleDropdownDirection = (
    event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>,
    dropdownId: string
  ) => {
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const dropdownHeight = 350;

    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    const dropdownDirection: DropDirection =
      spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "up" : "down";

    setDropDirections((prev) => ({
      ...prev,
      [dropdownId]: dropdownDirection
    }));
  };

  const handleToggleMapView = (mapId: string) => {
    const isCurrentlyMap = !!mapViews.get(mapId);
    trackEvent(ANALYTICS_EVENTS.ADDRESS_VIEW_TOGGLED, {
      view: isCurrentlyMap ? "list" : "map"
    });
    setMapViews((prev) => {
      const updatedMapViews = new Map(prev);
      updatedMapViews.set(mapId, !isCurrentlyMap);
      return updatedMapViews;
    });
  };

  const handleShowGetLocation = (addressElement: addressDetails) => {
    trackEvent(ANALYTICS_EVENTS.ADDRESS_DIRECTIONS_OPENED);
    showModal(GetMapGeolocation, {
      coordinates: addressElement.coordinates,
      name: addressElement.name,
      origin: policy.origin
    });
  };

  const handleShowChangeLocation = (
    mapId: string,
    currentMapName: string,
    coordinates: latlongInterface
  ) => {
    showModal(ChangeMapGeoLocation, {
      footerSaveAcl: userAccessLevel,
      mapId,
      coordinates,
      origin: policy.origin,
      name: currentMapName
    });
  };

  const handleChangeTerritory = (mapId: string, mapName: string) => {
    setValues({
      ...values,
      map: mapId,
      name: mapName
    });
    toggleAddressTerritoryListing();
  };

  const handleShowChangeName = (mapId: string, mapName: string) => {
    showModal(ChangeAddressName, {
      footerSaveAcl: userAccessLevel,
      mapId,
      name: mapName
    });
  };

  const handleShowAddUnit = (mapId: string, addressElement: addressDetails) => {
    showModal(NewUnit, {
      footerSaveAcl: userAccessLevel,
      mapId,
      addressData: addressElement
    });
  };

  const handleAddHigherFloor = (mapId: string) => {
    addFloorToMap(mapId, true);
  };

  const handleAddLowerFloor = (mapId: string) => {
    addFloorToMap(mapId);
  };

  const handleResetMap = async (mapId: string, mapName: string) => {
    const confirmReset = await confirm({
      title: t("common.confirmReset", "Confirm Reset"),
      message: t(
        "address.resetWarning",
        'All property statuses in "{{name}}" will be reset to their default state.\nYou cannot undo this.',
        { name: mapName }
      ),
      confirmText: t("common.reset", "Reset"),
      variant: "warning"
    });

    if (confirmReset) {
      resetMap(mapId);
    }
  };

  const handleDeleteMap = async (mapId: string, mapName: string) => {
    const confirmDelete = await confirm({
      title: t("common.confirmDelete", "Confirm Delete"),
      message: t(
        "address.deleteWarning",
        'Map "{{name}}" will be permanently deleted.\nYou cannot undo this.',
        { name: mapName }
      ),
      confirmText: t("common.delete", "Delete"),
      variant: "danger"
    });

    if (confirmDelete) {
      deleteMap(mapId, mapName, true);
    }
  };

  const handleToggleMapExpansion = (mapId: string) => {
    setAccordionKeys((prevKeys) => {
      if (prevKeys.includes(mapId)) {
        return prevKeys.filter((key) => key !== mapId);
      } else {
        return [...prevKeys, mapId];
      }
    });
  };

  const handleSequenceUpdate = (mapId: string) => {
    showModal(ChangeMapSequence, {
      footerSaveAcl: userAccessLevel,
      mapId
    });
  };

  const rowProps = {
    sortedAddressList,
    mapViews,
    processingMap,
    policy,
    userAccessLevel,
    accordionKeys,
    isReadonly,
    dropDirections,
    territoryId,
    handlers: {
      handleDropdownDirection,
      handleToggleMapView,
      handleShowGetLocation,
      handleShowChangeLocation,
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
  };

  return (
    <List
      className="virtual-map-container map-container-flush h-[80dvh]"
      listRef={listRef}
      onScroll={handleScroll}
      rowCount={sortedAddressList.length}
      rowHeight={getRowHeight}
      rowComponent={MapRow}
      rowProps={rowProps}
      overscanCount={1}
    />
  );
};

export default MapListing;
