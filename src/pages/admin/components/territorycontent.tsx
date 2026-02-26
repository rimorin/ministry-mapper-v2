import { lazy } from "react";
import TerritoryHeader from "../../../components/navigation/territoryheader";
import MapListing from "../../../components/navigation/maplist";
import SuspenseComponent from "../../../components/utils/suspense";

const MapView = SuspenseComponent(
  lazy(() => import("../../../components/navigation/mapview"))
);
import Welcome from "../../../components/statics/welcome";
import GettingStarted from "../../../components/statics/gettingstarted";
import {
  addressDetails,
  territoryDetails,
  HHOptionProps
} from "../../../utils/interface";
import { Policy } from "../../../utils/policies";
import { USER_ACCESS_LEVELS } from "../../../utils/constants";

/**
 * TerritoryContent Component
 *
 * Renders different views based on congregation setup state:
 *
 * PREREQUISITE: Parent (Admin) ensures all data is loaded before rendering this component
 * - congregation details, territories, options, policy are all loaded
 * - isLoading=false in parent before this component renders
 *
 * RENDERING FLOW:
 * 1. Setup incomplete (missing options/territories/maps) → GettingStarted guide
 * 2. Setup complete + no territory selected → Welcome message
 * 3. Setup complete + territory selected → Territory content (maps)
 */

interface TerritoryContentProps {
  selectedTerritory: {
    id: string;
    code: string | undefined;
    name: string | undefined;
  };
  userName: string;
  isMapView: boolean;
  sortedAddressList: Array<addressDetails>;
  accordingKeys: Array<string>;
  setAccordionKeys: React.Dispatch<React.SetStateAction<Array<string>>>;
  mapViews: Map<string, boolean>;
  setMapViews: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
  policy: Policy;
  values: object;
  setValues: React.Dispatch<React.SetStateAction<object>>;
  userAccessLevel: string | undefined;
  isReadonly: boolean;
  deleteMap: (
    mapId: string,
    name: string,
    showNotification?: boolean
  ) => Promise<void>;
  addFloorToMap: (mapId: string, higherFloor?: boolean) => Promise<void>;
  resetMap: (mapId: string) => Promise<void>;
  processingMap: { isProcessing: boolean; mapId: string | null };
  toggleAddressTerritoryListing: () => void;
  congregationOptions: HHOptionProps[];
  territories: Map<string, territoryDetails>;
  onCreateOptions: () => void;
  onCreateTerritory: () => void;
  hasAnyMaps: boolean;
}

export default function TerritoryContent({
  selectedTerritory,
  userName,
  isMapView,
  sortedAddressList,
  accordingKeys,
  setAccordionKeys,
  mapViews,
  setMapViews,
  policy,
  values,
  setValues,
  userAccessLevel,
  isReadonly,
  deleteMap,
  addFloorToMap,
  resetMap,
  processingMap,
  toggleAddressTerritoryListing,
  congregationOptions,
  territories,
  onCreateOptions,
  onCreateTerritory,
  hasAnyMaps
}: TerritoryContentProps) {
  // === DERIVE STATE FROM LOADED DATA ===
  // At this point, all data has been loaded (checked by parent's isLoading)
  const hasOptions = congregationOptions.length > 0;
  const hasTerritories = territories.size > 0;
  const hasSelectedTerritory = !!selectedTerritory.code;
  const isSetupComplete = hasOptions && hasTerritories && hasAnyMaps;

  // === RENDERING LOGIC ===
  // Render appropriate component based on congregation setup state

  // Case 1: Setup incomplete → Show Getting Started Guide
  // For new congregations or those missing options/territories/maps
  if (!isSetupComplete) {
    return (
      <GettingStarted
        onCreateOptions={onCreateOptions}
        onCreateTerritory={onCreateTerritory}
        hasOptions={hasOptions}
        hasTerritories={hasTerritories}
        hasAnyMaps={hasAnyMaps}
        selectedTerritory={selectedTerritory}
      />
    );
  }

  // Case 2: Setup complete, no territory selected → Show Welcome
  // For existing congregations where user hasn't selected a territory yet
  if (!hasSelectedTerritory) {
    return <Welcome name={userName} />;
  }

  // Case 3: Setup complete, territory selected → Show Territory Content
  // Normal operation - user working with a specific territory
  return (
    <div className="territory-content">
      <TerritoryHeader name={selectedTerritory.name} />
      {isMapView ? (
        <MapView
          key={`mapview-${selectedTerritory.id}`}
          sortedAddressList={sortedAddressList}
          policy={policy}
        />
      ) : (
        <MapListing
          key={`maplist-${selectedTerritory.id}`}
          sortedAddressList={sortedAddressList}
          accordingKeys={accordingKeys}
          setAccordionKeys={setAccordionKeys}
          mapViews={mapViews}
          setMapViews={setMapViews}
          policy={policy}
          values={values}
          setValues={setValues}
          userAccessLevel={userAccessLevel || USER_ACCESS_LEVELS.NO_ACCESS.CODE}
          isReadonly={isReadonly}
          deleteMap={deleteMap}
          addFloorToMap={addFloorToMap}
          resetMap={resetMap}
          processingMap={processingMap}
          toggleAddressTerritoryListing={toggleAddressTerritoryListing}
        />
      )}
    </div>
  );
}
