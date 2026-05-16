import { lazy } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { fadeSlideUp, exitUp } from "@/lib/motion";
import TerritoryHeader from "../../../components/navigation/territoryheader";
import SuspenseComponent from "../../../components/utils/suspense";
import Welcome from "../../../components/statics/welcome";
import GettingStarted from "../../../components/statics/gettingstarted";
import {
  addressDetails,
  territoryDetails,
  HHOptionProps
} from "../../../utils/interface";
import { Policy } from "../../../utils/policies";
import { USER_ACCESS_LEVELS } from "../../../utils/constants";

const MapView = SuspenseComponent(
  lazy(() => import("../../../components/navigation/mapview"))
);
const MapListing = SuspenseComponent(
  lazy(() => import("../../../components/navigation/maplist"))
);

interface TerritoryContentProps {
  selectedTerritory: {
    id: string;
    code: string | undefined;
    name: string | undefined;
  };
  userName: string;
  isMapView: boolean;
  isAssignmentLoading: boolean;
  onToggleMapView: () => void;
  onGenerateLink: () => void;
  sortedAddressList: Array<addressDetails>;
  accordionKeys: Array<string>;
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
  onCreateMap: () => void;
}

export default function TerritoryContent({
  selectedTerritory,
  userName,
  isMapView,
  isAssignmentLoading,
  onToggleMapView,
  onGenerateLink,
  sortedAddressList,
  accordionKeys,
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
  hasAnyMaps,
  onCreateMap
}: TerritoryContentProps) {
  const hasOptions = congregationOptions.length > 0;
  const hasTerritories = territories.size > 0;
  const hasSelectedTerritory = !!selectedTerritory.code;
  const isSetupComplete = hasOptions && hasTerritories && hasAnyMaps;

  return (
    <AnimatePresence mode="wait">
      {!isSetupComplete ? (
        <m.div
          key="getting-started"
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          exit={exitUp}
        >
          <GettingStarted
            onCreateOptions={onCreateOptions}
            onCreateTerritory={onCreateTerritory}
            onCreateMap={onCreateMap}
            hasOptions={hasOptions}
            hasTerritories={hasTerritories}
            hasAnyMaps={hasAnyMaps}
            selectedTerritory={selectedTerritory}
          />
        </m.div>
      ) : !hasSelectedTerritory ? (
        <m.div
          key="welcome"
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          exit={exitUp}
        >
          <Welcome name={userName} />
        </m.div>
      ) : (
        <m.div
          key={selectedTerritory.id}
          className="territory-content"
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          exit={exitUp}
        >
          <TerritoryHeader
            name={selectedTerritory.name}
            isMapView={isMapView}
            isAssignmentLoading={isAssignmentLoading}
            hasSelectedTerritory={
              !!(selectedTerritory.id || selectedTerritory.code)
            }
            userAccessLevel={userAccessLevel}
            onToggleView={onToggleMapView}
            onGenerateLink={onGenerateLink}
            onCreateMap={onCreateMap}
          />
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
              accordionKeys={accordionKeys}
              setAccordionKeys={setAccordionKeys}
              mapViews={mapViews}
              setMapViews={setMapViews}
              policy={policy}
              values={values}
              setValues={setValues}
              userAccessLevel={
                userAccessLevel || USER_ACCESS_LEVELS.NO_ACCESS.CODE
              }
              isReadonly={isReadonly}
              deleteMap={deleteMap}
              addFloorToMap={addFloorToMap}
              resetMap={resetMap}
              processingMap={processingMap}
              toggleAddressTerritoryListing={toggleAddressTerritoryListing}
              territoryId={selectedTerritory.id}
            />
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
