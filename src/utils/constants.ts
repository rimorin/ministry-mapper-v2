const DESTINATION_PROXIMITY_THRESHOLD_METERS = 50;

const DEFAULT_REPORT_ROLLING_DAYS = 30;

const STATUS_CODES = {
  DEFAULT: "not_done",
  DONE: "done",
  NOT_HOME: "not_home",
  DO_NOT_CALL: "do_not_call",
  INVALID: "invalid"
};

const NOT_HOME_STATUS_CODES = {
  DEFAULT: "1",
  SECOND_TRY: "2",
  THIRD_TRY: "3",
  FOURTH_TRY: "4"
};

const USER_ACCESS_LEVELS = {
  PUBLISHER: { CODE: "publisher", DISPLAY: "Publisher", SHORT_DISPLAY: "P" },
  NO_ACCESS: {
    CODE: "no_access",
    DISPLAY: "Delete Access",
    SHORT_DISPLAY: "D"
  },
  READ_ONLY: { CODE: "read_only", DISPLAY: "Read-only", SHORT_DISPLAY: "R" },
  CONDUCTOR: { CODE: "conductor", DISPLAY: "Conductor", SHORT_DISPLAY: "C" },
  TERRITORY_SERVANT: {
    CODE: "administrator",
    DISPLAY: "Administrator",
    SHORT_DISPLAY: "A"
  }
};

const MESSAGE_TYPES = {
  PUBLISHER: "publisher",
  CONDUCTOR: "conductor",
  ADMIN: "administrator"
};

const ACCESS_LEVEL_MAPPING = {
  [USER_ACCESS_LEVELS.NO_ACCESS.CODE]: -1,
  [USER_ACCESS_LEVELS.READ_ONLY.CODE]: 1,
  [USER_ACCESS_LEVELS.PUBLISHER.CODE]: 2,
  [USER_ACCESS_LEVELS.CONDUCTOR.CODE]: 2,
  [USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE]: 3
};

const LINK_TYPES = {
  VIEW: 0,
  ASSIGNMENT: "normal",
  PERSONAL: "personal"
};

const DEFAULT_UNIT_PADDING = 2;
const DEFAULT_FLOOR_PADDING = 2;
const DEFAULT_SELF_DESTRUCT_HOURS = 24;

const DEFAULT_CONGREGATION_MAX_TRIES = 1;

// Progress percentage at which a map enters its "endgame": remaining address
// cells are highlighted and the map progress breakdown is surfaced.
const ENDGAME_PROGRESS_THRESHOLD = 90;

const COUNTABLE_HOUSEHOLD_STATUS = [
  STATUS_CODES.DONE,
  STATUS_CODES.DEFAULT,
  STATUS_CODES.NOT_HOME
];

const MIN_START_FLOOR = 1;
const MAX_TOP_FLOOR = 50;
const ADDRESS_CREATE_SOURCE = "app";

const UNSUPPORTED_BROWSER_MSG = "Browser doesn't support this feature.";

const TERRITORY_TYPES = {
  SINGLE_STORY: "single",
  MULTIPLE_STORIES: "multi"
};

const DEFAULT_AGGREGATES = {
  value: 0,
  display: "0%"
};

//eslint-disable-next-line
const SPECIAL_CHARACTERS = /[`!@#$%^&()_+\=\[\]{};':"\\|,.<>\/?~]/;
const ALPHANUMERIC_HYPHEN = /^[a-zA-Z0-9-]+$/;

const MINIMUM_PASSWORD_LENGTH = 6;

const DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION = "sg";
const DEFAULT_COORDINATES = {
  Singapore: {
    lat: 1.2814921633413734,
    lng: 103.86357685947748
  },
  Malaysia: {
    lat: 4.2105,
    lng: 101.9758
  }
};

const PB_SECURITY_HEADER_KEY = "link-id";

const PB_FIELDS = {
  CONGREGATION_OPTIONS:
    "id, code, description, is_countable, is_default, sequence",
  MESSAGES: "id, message, created_by, read, pinned, created, type",
  ASSIGNMENTS:
    "id, user, type, expiry_date, publisher, created, expand.map.description, expand.user.name",
  ADDRESSES_SUBSCRIPTION:
    "id, code, coordinates, notes, status, not_home_tries, dnc_time, sequence, floor, updated, updated_by",
  ADDRESS_OPTIONS: "id,address,option",
  ROLES:
    "id, role, expand.congregation.id, expand.congregation.name, expand.congregation.max_tries, expand.congregation.origin, expand.congregation.expiry_hours, expand.congregation.expand.options_via_congregation.id, expand.congregation.expand.options_via_congregation.code, expand.congregation.expand.options_via_congregation.description, expand.congregation.expand.options_via_congregation.is_countable, expand.congregation.expand.options_via_congregation.is_default, expand.congregation.expand.options_via_congregation.sequence, expand.congregation.expand.territories_via_congregation.id, expand.congregation.expand.territories_via_congregation.code, expand.congregation.expand.territories_via_congregation.description, expand.congregation.expand.territories_via_congregation.progress, expand.congregation.expand.territories_via_congregation.coordinates",
  CONGREGATION_ROLES:
    "id, role, expand.user.name, expand.user.email, expand.user.verified",
  TERRITORIES: "id, code, description, progress, coordinates",
  MAPS: "id, sequence, description, type, progress, coordinates, aggregates",
  MAPS_SEQUENCE: "id, sequence, description",
  USERS: "id, name, email"
};

const REALTIME_DEBOUNCE_MS = 100;

const PREFERRED_TRAVEL_MODE_KEY = "preferredTravelMode";

export {
  UNSUPPORTED_BROWSER_MSG,
  STATUS_CODES,
  DEFAULT_FLOOR_PADDING,
  DEFAULT_SELF_DESTRUCT_HOURS,
  NOT_HOME_STATUS_CODES,
  MIN_START_FLOOR,
  MAX_TOP_FLOOR,
  COUNTABLE_HOUSEHOLD_STATUS,
  USER_ACCESS_LEVELS,
  LINK_TYPES,
  TERRITORY_TYPES,
  SPECIAL_CHARACTERS,
  MINIMUM_PASSWORD_LENGTH,
  DEFAULT_CONGREGATION_MAX_TRIES,
  ENDGAME_PROGRESS_THRESHOLD,
  ALPHANUMERIC_HYPHEN,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
  DEFAULT_COORDINATES,
  DEFAULT_AGGREGATES,
  ACCESS_LEVEL_MAPPING,
  DEFAULT_UNIT_PADDING,
  MESSAGE_TYPES,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS,
  DESTINATION_PROXIMITY_THRESHOLD_METERS,
  DEFAULT_REPORT_ROLLING_DAYS,
  ADDRESS_CREATE_SOURCE,
  REALTIME_DEBOUNCE_MS,
  PREFERRED_TRAVEL_MODE_KEY
};
