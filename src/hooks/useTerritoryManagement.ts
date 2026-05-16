import { useState } from "react";
import { RecordModel } from "pocketbase";
import {
  territoryDetails,
  type TerritoryPolygonCoordinate
} from "../utils/interface";
import { callFunction } from "../utils/pocketbase";
import useNotification from "./useNotification";
import useLocalStorage from "./useLocalStorage";
import { sortByCode } from "../utils/helpers/sorthelpers";

export default function useTerritoryManagement() {
  const { notifyError, runAction } = useNotification();
  const [isProcessingTerritory, setIsProcessingTerritory] =
    useState<boolean>(false);
  const [territories, setTerritories] = useState(
    new Map<string, territoryDetails>()
  );
  const [selectedTerritory, setSelectedTerritory] = useState<{
    id: string;
    code: string | undefined;
    name: string | undefined;
  }>({ id: "", code: undefined, name: undefined });
  const [showTerritoryListing, setShowTerritoryListing] =
    useState<boolean>(false);
  const [territoryCodeCache, setTerritoryCodeCache] = useLocalStorage(
    "territoryCode",
    ""
  );

  const toggleTerritoryListing = () => {
    setShowTerritoryListing((existingState) => !existingState);
  };

  const handleTerritorySelect = (eventKey: string | null) => {
    setSelectedTerritory((prev) => ({
      ...prev,
      id: eventKey as string
    }));
    setTerritoryCodeCache(eventKey as string);
    toggleTerritoryListing();
  };

  const deleteTerritory = async () => {
    if (!selectedTerritory.id) return;
    await runAction(
      async () => {
        await callFunction("/territory/delete", {
          method: "POST",
          body: { territory: selectedTerritory.id }
        });
        clearTerritorySelection();
      },
      { setLoading: setIsProcessingTerritory }
    );
  };

  const resetTerritory = async () => {
    if (!selectedTerritory.code) return;
    await runAction(
      () =>
        callFunction("/territory/reset", {
          method: "POST",
          body: { territory: selectedTerritory.id }
        }),
      { setLoading: setIsProcessingTerritory }
    );
  };

  const processCongregationTerritories = (
    territories: RecordModel[] | null | undefined
  ) => {
    const territoryList = new Map<string, territoryDetails>();
    if (!territories) return territoryList;
    try {
      for (const territory of territories) {
        territoryList.set(territory.id, {
          id: territory.id,
          code: territory["code"],
          name: territory["description"],
          aggregates: territory["progress"],
          coordinates: territory["coordinates"] as
            | TerritoryPolygonCoordinate
            | undefined
        });
      }
    } catch (error) {
      notifyError(error);
    }
    return territoryList;
  };

  const congregationTerritoryList = Array.from(territories.values());

  const clearTerritorySelection = () => {
    setSelectedTerritory({ id: "", code: undefined, name: undefined });
    setTerritoryCodeCache("");
  };

  const updateTerritoryCode = (territoryId: string, updatedCode: string) => {
    setSelectedTerritory((prev) => ({
      ...prev,
      code: updatedCode
    }));
    const updatedValues = Array.from(territories.values()).map((value) =>
      value.id === territoryId ? { ...value, code: updatedCode } : value
    );
    setTerritories(
      new Map<string, territoryDetails>(
        sortByCode(updatedValues).map((v) => [v.id, v])
      )
    );
  };

  const updateTerritoryName = (territoryId: string, updatedName: string) => {
    setSelectedTerritory((prev) => ({
      ...prev,
      name: updatedName
    }));
    setTerritories(
      new Map<string, territoryDetails>(
        Array.from(territories).map(([key, value]) => {
          if (key === territoryId) {
            return [key, { ...value, name: updatedName }];
          }
          return [key, value];
        })
      )
    );
  };

  return {
    selectedTerritory,
    setSelectedTerritory,
    territories,
    setTerritories,
    showTerritoryListing,
    toggleTerritoryListing,
    handleTerritorySelect,
    deleteTerritory,
    resetTerritory,
    processCongregationTerritories,
    congregationTerritoryList,
    isProcessingTerritory,
    territoryCodeCache,
    setTerritoryCodeCache,
    clearTerritorySelection,
    updateTerritoryCode,
    updateTerritoryName
  };
}
