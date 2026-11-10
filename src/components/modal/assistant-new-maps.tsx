import { lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type {
  AssistantProposal,
  ProposalState,
  SharedLocation
} from "../../hooks/useAssistant";
import { useModalManagement } from "../../hooks/useModalManagement";
import { geocodeAddress, type GeocodeMatch } from "../../utils/geocode";
import { mapPlans, type MapPlan } from "../../utils/assistantActions";
import { STEADY_HOVER } from "./assistant-shared";

const ChangeMapGeolocation = lazy(() => import("./changegeolocation"));

// Units shown before "Show all".
const UNIT_PREVIEW = 12;

// Every new map needs a location before the card can be confirmed.
export const allMapsPlaced = (
  proposal: AssistantProposal,
  state?: ProposalState
) =>
  mapPlans(proposal).every((_, index) => !!state?.locations?.[String(index)]);

interface NewMapRowProps {
  plan: MapPlan;
  location?: SharedLocation;
  editable: boolean;
  origin?: string;
  onLocation: (location: SharedLocation) => void;
}

const NewMapRow = ({
  plan,
  location,
  editable,
  origin,
  onLocation
}: NewMapRowProps) => {
  const { t } = useTranslation();
  const { showModal } = useModalManagement();
  const [showAll, setShowAll] = useState(false);
  // undefined while looking, null when nothing was found.
  const [match, setMatch] = useState<GeocodeMatch | null | undefined>(
    location ? null : undefined
  );

  // The address the admin gave is looked up once, to offer a likely spot.
  useEffect(() => {
    if (location || !editable) return;
    const controller = new AbortController();
    geocodeAddress(plan.address, origin, controller.signal)
      .then((found) => {
        if (!controller.signal.aborted) setMatch(found);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMatch(null);
      });
    return () => controller.abort();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- looked up once per map
  }, [plan.address]);

  const pickOnMap = async () => {
    const picked = (await showModal(ChangeMapGeolocation, {
      name: plan.name,
      coordinates:
        location ?? (match ? { lat: match.lat, lng: match.lng } : undefined),
      origin,
      isSelectOnly: true
    })) as SharedLocation | undefined;
    if (picked) onLocation({ lat: picked.lat, lng: picked.lng });
  };

  const units = showAll ? plan.units : plan.units.slice(0, UNIT_PREVIEW);
  const shape =
    plan.type === "multi"
      ? t(
          "assistant.action.newMapBuilding",
          "Building, floors {{lowest}} to {{top}}, {{units}} units a floor",
          {
            lowest: plan.lowest_floor,
            top: plan.top_floor,
            units: plan.units.length
          }
        )
      : t("assistant.action.newMapHouses", "Houses");

  return (
    <div className="flex flex-col gap-1 rounded-md border p-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{plan.name}</span>
        <span className="text-muted-foreground">
          {shape} ·{" "}
          {t("assistant.action.homes", "{{count}} homes", {
            count: plan.homes
          })}
        </span>
      </div>
      <p className="break-words text-muted-foreground">
        {units.join(", ")}
        {plan.units.length > UNIT_PREVIEW && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-1 py-0"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? t("assistant.action.showFewer", "Show fewer")
              : t("assistant.action.showAllUnits", "Show all {{count}}", {
                  count: plan.units.length
                })}
          </Button>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {location ? (
          <span className="flex items-center gap-1 text-success">
            <Check className="size-3.5" />
            {t("assistant.action.locationSet", "Location set")}
          </span>
        ) : match === undefined && editable ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            {t("assistant.action.lookingUp", "Looking up {{address}}…", {
              address: plan.address
            })}
          </span>
        ) : match ? (
          <span className="min-w-0 break-words">
            {t("assistant.action.found", "Found: {{place}}", {
              place: match.formatted
            })}
          </span>
        ) : editable ? (
          <span className="text-muted-foreground">
            {t(
              "assistant.action.notFound",
              "{{address}} was not found; pick it on the map.",
              { address: plan.address }
            )}
          </span>
        ) : null}
        {editable && (
          <div className="ml-auto flex gap-2">
            {match && !location && (
              <Button
                type="button"
                size="sm"
                className={STEADY_HOVER}
                onClick={() => onLocation({ lat: match.lat, lng: match.lng })}
              >
                {t("assistant.action.useThis", "Use this")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={STEADY_HOVER}
              onClick={() => void pickOnMap()}
            >
              <MapPin />
              {location
                ? t("assistant.action.change", "Change")
                : t("assistant.action.pickOnMap", "Pick on map")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AssistantNewMapsProps {
  proposal: AssistantProposal;
  state?: ProposalState;
  // Locations can be set only before the card is confirmed.
  editable: boolean;
  origin?: string;
  onStatus: (patch: Partial<ProposalState>) => void;
}

// The new maps on a create card, each with its units and where it is.
const AssistantNewMaps = ({
  proposal,
  state,
  editable,
  origin,
  onStatus
}: AssistantNewMapsProps) => {
  const { t } = useTranslation();
  const plans = mapPlans(proposal);
  if (!plans.length) {
    return (
      <p className="text-muted-foreground">
        {t(
          "assistant.action.noMapsYet",
          "No maps yet; ask to add them once the territory exists."
        )}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {plans.map((plan, index) => (
        <NewMapRow
          key={plan.name}
          plan={plan}
          location={state?.locations?.[String(index)]}
          editable={editable}
          origin={origin}
          onLocation={(location) =>
            onStatus({
              locations: { ...state?.locations, [String(index)]: location }
            })
          }
        />
      ))}
      <p className="text-muted-foreground">
        {t("assistant.action.homesInAll", "{{count}} homes in all", {
          count: Number(proposal.data?.homes ?? 0)
        })}
      </p>
    </div>
  );
};

export default AssistantNewMaps;
