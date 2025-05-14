import { useState, useCallback } from "react";
import { addressDetails } from "../../utils/interface";
import { deleteDataById, callFunction } from "../../utils/pocketbase";
import { RecordModel } from "pocketbase";
import { TERRITORY_TYPES, DEFAULT_COORDINATES } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import errorHandler from "../../utils/helpers/errorhandler";
import useLocalStorage from "../../utils/helpers/storage";

export default function useMapManagement() {
  const { t } = useTranslation();
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

  const deleteMap = useCallback(
    async (mapId: string, name: string, showAlert: boolean) => {
      setProcessingMap({ isProcessing: true, mapId: mapId });
      try {
        await deleteDataById("maps", mapId, {
          requestKey: `map-del-${mapId}`
        });
        if (showAlert)
          alert(t("map.deleteSuccess", "Deleted address, {{name}}.", { name }));
      } catch (error) {
        errorHandler(error);
      } finally {
        setProcessingMap({ isProcessing: false, mapId: null });
      }
    },
    [t]
  );

  const addFloorToMap = useCallback(
    async (mapId: string, higherFloor = false) => {
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
        errorHandler(error);
      } finally {
        setProcessingMap({ isProcessing: false, mapId: null });
      }
    },
    []
  );

  const resetMap = useCallback(async (mapId: string) => {
    setProcessingMap({ isProcessing: true, mapId: mapId });
    try {
      await callFunction("/map/reset", {
        method: "POST",
        body: {
          map: mapId
        }
      });
    } catch (error) {
      errorHandler(error);
    } finally {
      setProcessingMap({ isProcessing: false, mapId: null });
    }
  }, []);

  const processMapRecord = useCallback((mapRecord: RecordModel) => {
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
      mapId: mapRecord.code,
      name: mapRecord.description,
      coordinates: mapRecord.coordinates || DEFAULT_COORDINATES.Singapore
    } as addressDetails;
  }, []);

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
    processMapRecord
  };
}
