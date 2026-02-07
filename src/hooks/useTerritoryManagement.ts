import { useState } from "react";
import {
  territoryDetails,
  TerritoryManagementOptions
} from "../utils/interface";
import { deleteDataById, callFunction } from "../utils/pocketbase";
import useNotification from "./useNotification";
import useLocalStorage from "./useLocalStorage";

export default function useTerritoryManagement({
  congregationCode
}: TerritoryManagementOptions) {
  const { notifyError } = useNotification();
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
    setIsProcessingTerritory(true);
    try {
      await deleteDataById("territories", selectedTerritory.id, {
        requestKey: `territory-del-${congregationCode}-${selectedTerritory.code}`
      });
      window.location.reload();
    } catch (error) {
      notifyError(error);
    } finally {
      setIsProcessingTerritory(false);
    }
  };

  const resetTerritory = async () => {
    if (!selectedTerritory.code) return;
    setIsProcessingTerritory(true);
    try {
      await callFunction("/territory/reset", {
        method: "POST",
        body: {
          territory: selectedTerritory.id
        }
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setIsProcessingTerritory(false);
    }
  };

  const processCongregationTerritories = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    congregationTerritories: any
  ) => {
    const territoryList = new Map<string, territoryDetails>();
    try {
      if (!congregationTerritories) return territoryList;
      for (const territory in congregationTerritories) {
        const name = congregationTerritories[territory]["description"];
        const id = congregationTerritories[territory]["id"];
        const code = congregationTerritories[territory]["code"];
        const progress = congregationTerritories[territory]["progress"];
        const coordinates = congregationTerritories[territory]["coordinates"];
        territoryList.set(id, {
          id: id,
          code: code,
          name: name,
          aggregates: progress,
          coordinates: coordinates
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
    setTerritories(
      new Map<string, territoryDetails>(
        Array.from(territories).map(([key, value]) => {
          if (key === territoryId) {
            value.code = updatedCode;
          }
          return [key, value];
        })
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
            value.name = updatedName;
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
