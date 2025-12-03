import { RuleNames } from "react-password-checklist";
import { getAssetUrl } from "./helpers/assetpath";

const DESTINATION_PROXIMITY_THRESHOLD_METERS = 50;

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

const MUTABLE_CODES = [STATUS_CODES.DONE, STATUS_CODES.NOT_HOME];

const LINK_TYPES = {
  VIEW: 0,
  ASSIGNMENT: "normal",
  PERSONAL: "personal"
};

const DEFAULT_UNIT_PADDING = 2;
const DEFAULT_FLOOR_PADDING = 2;
// 24 hours
const DEFAULT_SELF_DESTRUCT_HOURS = 24;
const MIN_PERCENTAGE_DISPLAY = 10;
// 3 secs
const FIREBASE_FUNCTION_TIMEOUT = 3000;

const DEFAULT_CONGREGATION_MAX_TRIES = 1;

const DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE = false;
const DEFAULT_MULTPLE_OPTION_DELIMITER = ", ";

const COUNTABLE_HOUSEHOLD_STATUS = [
  STATUS_CODES.DONE,
  STATUS_CODES.DEFAULT,
  STATUS_CODES.NOT_HOME
];

const MIN_START_FLOOR = 1;
const MAX_TOP_FLOOR = 50;

const TERRITORY_SELECTOR_VIEWPORT_HEIGHT = "85vh";
const LINK_SELECTOR_VIEWPORT_HEIGHT = "40vh";

const TERRITORY_VIEW_WINDOW_WELCOME_TEXT =
  "<!DOCTYPE html><html><head><title>Loading Territory...</title></<head><body><style> body {display: flex; justify-content: center;align-items: center;}</style><h1>Loading Territory...</h1></body></html>";

const UNSUPPORTED_BROWSER_MSG = "Browser doesn't support this feature.";
const PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY = 600;
const DEFAULT_UNIT_DNC_MS_TIME = 0;

const TERRITORY_TYPES = {
  SINGLE_STORY: "single",
  MULTIPLE_STORIES: "multi"
};

const NOTIFICATION_TYPES = {
  FEEDBACK: 1,
  INSTRUCTIONS: 2
};

const DEFAULT_AGGREGATES = {
  value: 0,
  display: "0%"
};

//eslint-disable-next-line
const SPECIAL_CHARACTERS = /[`!@#$%^&()_+\=\[\]{};':"\\|,.<>\/?~][^-*]/;
const NUMERIC_CHARACTERS = /^-?\d+$/;
// Hardcode for local SG postal standards
const MINIMUM_POSTAL_LENGTH = 6;

const MINIMUM_PASSWORD_LENGTH = 6;
const PASSWORD_POLICY = [
  "minLength",
  "number",
  "capital",
  "match"
] as RuleNames[];

const MINISTRY_MAPPER_WIKI_PAGE =
  "https://github.com/rimorin/ministry-mapper/wiki";

const ADMIN_WIKI = "for-administrators";
const CONDUCTOR_WIKI = "for-conductors";
const PUBLISHER_WIKI = "for-Publishers";

const WIKI_CATEGORIES = {
  CREATE_ACCOUNT: `${MINISTRY_MAPPER_WIKI_PAGE}/Getting-Started-(for-Administrators-and-Conductors)#setup-accounts`,
  CREATE_TERRITORIES: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#2-create-territories`,
  DELETE_TERRITORIES: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#4-deleting-territories`,
  RESET_TERRITORIES: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#9-resetting-territories`,
  CHANGE_TERRITORY_NAME: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#change-territory-name`,
  CHANGE_TERRITORY_CODE: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#change-territory-code`,
  CHANGE_ADDRESS_NAME: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#change-address-name`,
  RESET_ADDRESS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#8-resetting-addresses`,
  DELETE_ADDRESS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#5-deleting-addresses`,
  DELETE_ADDRESS_FLOOR: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#adddelete-floors-for-public-addresses-only`,
  CHANGE_ADDRESS_POSTAL: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#change-postal-code`,
  CREATE_PUBLIC_ADDRESS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#for-public-addresses`,
  CREATE_PRIVATE_ADDRESS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#for-private-addresses`,
  ADD_PUBLIC_UNIT: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#adddelete-units-for-public-addresses-only`,
  ADD_DELETE_PRIVATE_PROPERTY: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#adddelete-house-for-private-addresses-only`,
  UPDATE_UNIT_NUMBER: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#change-unit-sequence-for-public-addresses-only`,
  UPDATE_INSTRUCTIONS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#11-giving-instructions-to-publishers`,
  CREATE_PERSONAL_SLIPS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#10-assigning-slips-for-personal-territory`,
  INVITE_USER: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#inviting-users`,
  MANAGE_USERS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#managing-users`,
  MANAGE_CONG_SETTINGS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#14-other-congregation-settings`,
  MANAGE_CONG_OPTIONS: `${MINISTRY_MAPPER_WIKI_PAGE}/${ADMIN_WIKI}#15-congregation-options`,
  GET_ASSIGNMENTS: `${MINISTRY_MAPPER_WIKI_PAGE}/${CONDUCTOR_WIKI}#list-of-assignments`,
  UPDATE_UNIT_STATUS: `${MINISTRY_MAPPER_WIKI_PAGE}/${PUBLISHER_WIKI}#4-marking-slips`,
  CONDUCTOR_ADDRESS_FEEDBACK: `${MINISTRY_MAPPER_WIKI_PAGE}/${CONDUCTOR_WIKI}#4-receiving-feedback-from-publishers`,
  PUBLISHER_ADDRESS_FEEDBACK: `${MINISTRY_MAPPER_WIKI_PAGE}/${PUBLISHER_WIKI}#6-giving-feedback-to-administrators-and-conductors`
};

const DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION = "sg";
// create a map of coordinates for each congregation
// key is the congregation name
// value is the coordinates
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

const CLOUD_FUNCTIONS_CALLS = {
  UPDATE_USER_ACCESS: "updateUserAccess",
  GET_CONGREGATION_USERS: "getCongregationUsers",
  GET_USER_BY_EMAIL: "getUserByEmail"
};

const PB_SECURITY_HEADER_KEY = "link-id";

const PB_FIELDS = {
  CONGREGATION: "id, name, code, max_tries, origin, expiry_hours",
  CONGREGATION_OPTIONS:
    "id, code, description, is_countable, is_default, sequence",
  MESSAGES: "id, message, created_by, read, pinned, created, type",
  ASSIGNMENTS:
    "id, user, type, expiry_date, publisher, created, expand.map.description",
  ASSIGNMENT_LINKS:
    "id, map, expiry_date, publisher, expand.map.description, expand.map.type, expand.map.location, expand.map.coordinates, expand.map.progress, expand.map.expand.congregation.max_tries, expand.map.expand.congregation.origin, expand.map.expand.congregation.expiry_hours, expand.map.expand.congregation.id",
  ADDRESSES:
    "id, code, coordinates, notes, type, status, not_home_tries, dnc_time, sequence, floor, updated, updated_by",
  ROLES: "id, role, expand.congregation.id, expand.congregation.name",
  CONGREGATION_ROLES:
    "id, role, expand.user.name, expand.user.email, expand.user.verified",
  TERRITORIES: "id, code, description, progress",
  MAPS: "id, sequence, description, type, location, progress, coordinates, aggregates"
};

const SPEED_DIAL = {
  DIMENSIONS: {
    FAB_SIZE: {
      WIDTH: "52px",
      HEIGHT: "52px"
    },
    ACTION_SIZE: {
      WIDTH: "48px",
      HEIGHT: "48px"
    },
    MOBILE_FAB_SIZE: {
      WIDTH: "48px",
      HEIGHT: "48px"
    },
    MOBILE_ACTION_SIZE: {
      WIDTH: "40px",
      HEIGHT: "40px"
    }
  },
  SPACING: {
    ACTION_DISTANCE: 70,
    CENTER_OFFSET: 4 // (56 - 48) / 2
  },
  STYLES: {
    Z_INDEX: 1050,
    OPACITY: 0.9,
    BACKDROP_OPACITY: 0.1,
    BOX_SHADOW: {
      FAB: "0 4px 12px rgba(0,0,0,0.15)",
      ACTION: "0 2px 8px rgba(0,0,0,0.15)",
      HOVER_FAB: "0 6px 16px rgba(0, 0, 0, 0.2)",
      HOVER_ACTION: "0 4px 12px rgba(0, 0, 0, 0.2)"
    }
  },
  TRANSITIONS: {
    DURATION: "0.2s",
    EASING: "ease-in-out",
    STAGGER_DELAY: 0.05
  },
  TRANSFORM: {
    SCALE: {
      NORMAL: 1,
      HOVER: 1.1,
      ACTIVE_FAB: 0.95,
      ACTIVE_ACTION: 0.9,
      CLOSED: 0
    },
    ROTATION: {
      CLOSED: "0deg",
      OPEN: "45deg"
    }
  },
  DEFAULTS: {
    DIRECTION: "up" as const,
    VARIANT: "primary",
    POSITION: {
      bottom: "30px",
      left: "25px"
    },
    ICON_URL: getAssetUrl("plus.svg"),
    ICON_SIZE: 24
  },
  MOBILE_BREAKPOINT: 768
};

export {
  UNSUPPORTED_BROWSER_MSG,
  STATUS_CODES,
  MUTABLE_CODES,
  DEFAULT_FLOOR_PADDING,
  DEFAULT_SELF_DESTRUCT_HOURS,
  TERRITORY_VIEW_WINDOW_WELCOME_TEXT,
  NOT_HOME_STATUS_CODES,
  MIN_START_FLOOR,
  MAX_TOP_FLOOR,
  COUNTABLE_HOUSEHOLD_STATUS,
  USER_ACCESS_LEVELS,
  LINK_TYPES,
  TERRITORY_SELECTOR_VIEWPORT_HEIGHT,
  FIREBASE_FUNCTION_TIMEOUT,
  MIN_PERCENTAGE_DISPLAY,
  PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY,
  DEFAULT_UNIT_DNC_MS_TIME,
  TERRITORY_TYPES,
  SPECIAL_CHARACTERS,
  MINIMUM_POSTAL_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
  PASSWORD_POLICY,
  DEFAULT_CONGREGATION_MAX_TRIES,
  MINISTRY_MAPPER_WIKI_PAGE,
  NUMERIC_CHARACTERS,
  LINK_SELECTOR_VIEWPORT_HEIGHT,
  WIKI_CATEGORIES,
  NOTIFICATION_TYPES,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
  DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE,
  DEFAULT_MULTPLE_OPTION_DELIMITER,
  DEFAULT_COORDINATES,
  CLOUD_FUNCTIONS_CALLS,
  DEFAULT_AGGREGATES,
  ACCESS_LEVEL_MAPPING,
  DEFAULT_UNIT_PADDING,
  MESSAGE_TYPES,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS,
  SPEED_DIAL,
  DESTINATION_PROXIMITY_THRESHOLD_METERS
};
