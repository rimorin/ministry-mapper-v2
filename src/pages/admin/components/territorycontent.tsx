import TerritoryHeader from "../../../components/navigation/territoryheader";
import MapView from "../../../components/navigation/mapview";
import MapListing from "../../../components/navigation/maplist";
import Welcome from "../../../components/statics/welcome";
import GettingStarted from "../../../components/statics/gettingstarted";
import {
  addressDetails,
  territoryDetails,
  HHOptionProps
} from "../../../utils/interface";
import { Policy } from "../../../utils/policies";
import { USER_ACCESS_LEVELS } from "../../../utils/constants";

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
  // Show guide until all 3 conditions are met:
  // 1. Options are created
  // 2. At least 1 territory created
  // 3. At least 1 map created (across all territories)

  const hasOptions = congregationOptions.length > 0;
  const hasTerritories = territories.size > 0;

  const showGuide = !hasOptions || !hasTerritories || !hasAnyMaps;

  if (showGuide) {
    return (
      <GettingStarted
        onCreateOptions={onCreateOptions}
        onCreateTerritory={onCreateTerritory}
      />
    );
  }

  if (!selectedTerritory.code) {
    return <Welcome name={userName} />;
  }

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
