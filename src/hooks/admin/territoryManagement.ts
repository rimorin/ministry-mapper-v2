import { useState, useCallback, useMemo } from "react";
import { territoryDetails } from "../../utils/interface";
import {
  deleteDataById,
  callFunction,
  unsubscriber
} from "../../utils/pocketbase";
import { useTranslation } from "react-i18next";
import errorHandler from "../../utils/helpers/errorhandler";
import useLocalStorage from "../../utils/helpers/storage";

interface TerritoryManagementOptions {
  congregationCode: string;
}

export default function useTerritoryManagement({
  congregationCode
}: TerritoryManagementOptions) {
  const { t } = useTranslation();
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

  const toggleTerritoryListing = useCallback(() => {
    setShowTerritoryListing((existingState) => !existingState);
  }, []);

  const handleTerritorySelect = useCallback(
    (eventKey: string | null) => {
      setSelectedTerritory((prev) => ({
        ...prev,
        id: eventKey as string
      }));
      setTerritoryCodeCache(eventKey as string);
      toggleTerritoryListing();
    },
    [toggleTerritoryListing]
  );

  const deleteTerritory = useCallback(async () => {
    if (!selectedTerritory.id) return;
    setIsProcessingTerritory(true);
    try {
      // kill all subscriptions before deleting
      unsubscriber(["maps", "addresses", "messages", "assignments"]);
      await deleteDataById("territories", selectedTerritory.id, {
        requestKey: `territory-del-${congregationCode}-${selectedTerritory.code}`
      });
      alert(
        t("territory.deleteSuccess", "Deleted territory, {{code}}.", {
          code: selectedTerritory.code
        })
      );
      window.location.reload();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsProcessingTerritory(false);
    }
  }, [selectedTerritory.id, selectedTerritory.code, congregationCode]);

  const resetTerritory = useCallback(async () => {
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
      errorHandler(error);
    } finally {
      setIsProcessingTerritory(false);
    }
  }, [selectedTerritory.code, selectedTerritory.id]);

  const processCongregationTerritories = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (congregationTerritories: any) => {
      const territoryList = new Map<string, territoryDetails>();
      try {
        if (!congregationTerritories) return territoryList;
        for (const territory in congregationTerritories) {
          const name = congregationTerritories[territory]["description"];
          const id = congregationTerritories[territory]["id"];
          const code = congregationTerritories[territory]["code"];
          const progress = congregationTerritories[territory]["progress"];
          territoryList.set(id, {
            id: id,
            code: code,
            name: name,
            aggregates: progress
          });
        }
      } catch (error) {
        console.error("Error processing congregation territories: ", error);
      }
      return territoryList;
    },
    []
  );

  const congregationTerritoryList = useMemo(
    () => Array.from(territories.values()),
    [territories]
  );

  const clearTerritorySelection = useCallback(() => {
    setSelectedTerritory({ id: "", code: undefined, name: undefined });
    setTerritoryCodeCache("");
  }, []);

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
    clearTerritorySelection
  };
}
