import { useState } from "react";
import {
  addressDetails,
  territoryDetails,
  valuesDetails
} from "../utils/interface";
import { deleteDataById, callFunction, getList } from "../utils/pocketbase";
import { RecordModel } from "pocketbase";
import {
  TERRITORY_TYPES,
  DEFAULT_COORDINATES,
  PB_FIELDS
} from "../utils/constants";
import { useTranslation } from "react-i18next";
import useNotification from "./useNotification";
import useLocalStorage from "./useLocalStorage";

export default function useMapManagement() {
  const { t } = useTranslation();
  const { notifyError, notifySuccess, notifyWarning } = useNotification();
  const [processingMap, setProcessingMap] = useState<{
    isProcessing: boolean;
    mapId: string | null;
  }>({ isProcessing: false, mapId: null });
  const [sortedAddressList, setSortedAddressList] = useState<
    Array<addressDetails>
  >([]);
  const [accordingKeys, setAccordionKeys] = useState<Array<string>>([]);
  const [mapViews, setMapViews] = useState<Map<string, boolean>>(new Map());
  const [isMapView, setIsMapView] = useLocalStorage("mapView", false);

  const deleteMap = async (
    mapId: string,
    name: string,
    showNotification = true
  ) => {
    setProcessingMap({ isProcessing: true, mapId: mapId });
    try {
      await deleteDataById("maps", mapId, {
        requestKey: `map-del-${mapId}`
      });
      if (showNotification) {
        notifySuccess(
          t("map.deleteSuccess", "Deleted address, {{name}}.", { name })
        );
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setProcessingMap({ isProcessing: false, mapId: null });
    }
  };

  const addFloorToMap = async (mapId: string, higherFloor = false) => {
    setProcessingMap({ isProcessing: true, mapId: mapId });
    try {
      await callFunction("/map/floor/add", {
        method: "POST",
        body: {
          map: mapId,
          add_higher: higherFloor
        }
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setProcessingMap({ isProcessing: false, mapId: null });
    }
  };

  const resetMap = async (mapId: string) => {
    setProcessingMap({ isProcessing: true, mapId: mapId });
    try {
      await callFunction("/map/reset", {
        method: "POST",
        body: {
          map: mapId
        }
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setProcessingMap({ isProcessing: false, mapId: null });
    }
  };

  const processMapRecord = (mapRecord: RecordModel) => {
    return {
      id: mapRecord.id,
      type: mapRecord.type || TERRITORY_TYPES.MULTIPLE_STORIES,
      location: mapRecord.location || "",
      aggregates: {
        display: mapRecord.progress + "%",
        value: mapRecord.progress,
        notDone: mapRecord.aggregates?.notDone || 0,
        notHome: mapRecord.aggregates?.notHome || 0
      },
      name: mapRecord.description,
      coordinates: mapRecord.coordinates || DEFAULT_COORDINATES.Singapore,
      sequence: mapRecord.sequence
    } as addressDetails;
  };

  const setupMaps = async (territoryId: string) => {
    if (!territoryId) return;
    const maps = await getList("maps", {
      filter: `territory="${territoryId}"`,
      requestKey: null,
      sort: "sequence",
      fields: PB_FIELDS.MAPS
    });
    const newMapViews = new Map<string, boolean>();
    const newAccordionKeys = [] as Array<string>;
    const sortedMaps = maps.map((map) => {
      const mapId = map.id;
      newMapViews.set(mapId, isMapView);
      newAccordionKeys.push(mapId);
      return processMapRecord(map);
    });
    setSortedAddressList(sortedMaps);
    setAccordionKeys(newAccordionKeys);
    setMapViews(newMapViews);
  };

  const handleAddressTerritorySelect = async (
    newTerritoryId: string | null,
    values: valuesDetails,
    selectedTerritoryId: string,
    territories: Map<string, territoryDetails>,
    toggleAddressTerritoryListing: () => void
  ) => {
    const mapId = values.map as string;
    const newTerritoryCode = territories.get(newTerritoryId as string)?.code;

    try {
      toggleAddressTerritoryListing();
      await callFunction("/map/territory/update", {
        method: "POST",
        body: {
          map: mapId,
          new_territory: newTerritoryId,
          old_territory: selectedTerritoryId
        }
      });
      setSortedAddressList(
        sortedAddressList.filter((address) => address.id !== mapId)
      );
      notifyWarning(
        t(
          "territory.changeSuccess",
          "Territory {{code}} updated successfully.",
          { code: newTerritoryCode }
        )
      );
    } catch (error) {
      notifyError(error);
    }
  };

  return {
    processingMap,
    sortedAddressList,
    setSortedAddressList,
    accordingKeys,
    setAccordionKeys,
    mapViews,
    setMapViews,
    isMapView,
    setIsMapView,
    deleteMap,
    addFloorToMap,
    resetMap,
    processMapRecord,
    setupMaps,
    handleAddressTerritorySelect
  };
}
