import { useTranslation } from "react-i18next";
import {
  ArrowRightLeft,
  Ban,
  CheckCheck,
  DoorOpen,
  FileText,
  House,
  Layers,
  Link2,
  Link2Off,
  ListChecks,
  MapPin,
  MapPinPlus,
  MapPlus,
  Navigation,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Settings,
  SquarePlus,
  UserCog,
  UserPlus,
  type LucideIcon
} from "lucide-react";
import type { AssistantProposal } from "../../hooks/useAssistant";

// The app's buttons lift on hover. Under a pointer resting on the bottom edge
// the lift moves the button away, ends the hover and drops it back: a flicker.
// The panel's buttons stay put so their hit area never moves.
export const STEADY_HOVER = "hover:not-aria-[haspopup]:translate-y-0";

// Each card's icon, also shown beside the function that prepared it.
export const KIND_ICONS: Record<AssistantProposal["kind"], LucideIcon> = {
  role_change: UserCog,
  role_revoke: UserCog,
  role_grant: UserPlus,
  map_rename: Pencil,
  territory_rename: Pencil,
  share_link: Link2,
  pin_message: Pin,
  report_email: FileText,
  mark_read: CheckCheck,
  unpin_message: PinOff,
  map_location: MapPin,
  link_revoke: Link2Off,
  quick_link: Navigation,
  home_update: House,
  map_reset: RotateCcw,
  territory_reset: RotateCcw,
  tries_reset: DoorOpen,
  homes_status: ListChecks,
  dnc_return: Ban,
  settings: Settings,
  map_move: ArrowRightLeft,
  floor_add: Layers,
  unit_add: SquarePlus,
  territory_create: MapPlus,
  maps_create: MapPinPlus
};

// Each status in its theme colour, as on the map screen.
export const STATUS_CELL: Record<string, string> = {
  done: "bg-status-done/25 ring-status-done/50",
  not_home: "bg-status-nothome/25 ring-status-nothome/50",
  do_not_call: "bg-status-dnc/25 ring-status-dnc/50",
  invalid: "bg-status-invalid/25 ring-status-invalid/50",
  not_done: "bg-muted ring-border"
};

export const STATUS_ORDER = [
  "not_done",
  "done",
  "not_home",
  "do_not_call",
  "invalid"
] as const;

// Values the app already has labels for: statuses, roles, link and map types.
const VALUE_LABELS: Record<string, [string, string]> = {
  not_done: ["address.notDone", "Not Done"],
  done: ["address.done", "Done"],
  not_home: ["address.notHome", "Not Home"],
  do_not_call: ["address.dnc", "DNC"],
  invalid: ["address.invalid", "Invalid"],
  administrator: ["user.roles.administrator", "Admin"],
  conductor: ["user.roles.conductor", "Conductor"],
  read_only: ["user.roles.readOnly", "Read Only"],
  personal: ["links.personal", "Personal"],
  single: ["map.singleStory", "Single-Story"],
  multi: ["map.multiStory", "Multi-story"]
};

// Labels a value the app names; any other value shows as given.
export const useValueLabel = () => {
  const { t } = useTranslation();
  return (value: string) => {
    const label = VALUE_LABELS[value];
    return label ? t(label[0], label[1]) : value;
  };
};

// The weekday names the backend groups by, Sunday first as Date counts them.
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

// A weekday the backend named, in the admin's language; undefined for any
// other text. 7 January 2024 was a Sunday.
export const weekdayName = (
  value: string,
  locale: string,
  weekday: "long" | "short" = "long"
) => {
  const day = WEEKDAYS.indexOf(value);
  return day < 0
    ? undefined
    : new Intl.DateTimeFormat(locale, { weekday }).format(
        new Date(2024, 0, 7 + day)
      );
};
