import { RecordModel } from "pocketbase";
import {
  COUNTABLE_HOUSEHOLD_STATUS,
  STATUS_CODES,
  LINK_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
  USER_ACCESS_LEVELS,
  DEFAULT_SELF_DESTRUCT_HOURS
} from "./constants";
import { HHOptionProps, unitDetails } from "./interface";

const AVAILABLE_STYLE_CLASS = "available";

const processAvailableColour = (
  completedUnit = false,
  countableUnit = true,
  addressProgress = 0
) => {
  if (!countableUnit || completedUnit) return "";
  if (addressProgress < 90) return AVAILABLE_STYLE_CLASS;

  return `${AVAILABLE_STYLE_CLASS} cell-highlight`;
};

export class Policy {
  userName: string;
  userRole: string;
  maxTries: number;
  countableTypes: Array<string>;
  defaultType: string;
  origin: string;
  options: Array<HHOptionProps>;
  defaultExpiryHours: number;
  constructor(
    userName = "",
    options?: Array<HHOptionProps>,
    maxtries = DEFAULT_CONGREGATION_MAX_TRIES,
    origin = DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
    userRole = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
    defaultExpiryHours = DEFAULT_SELF_DESTRUCT_HOURS
  ) {
    this.userName = userName;
    this.userRole = userRole;
    this.maxTries = maxtries;
    this.countableTypes = [];
    this.defaultType = "";
    this.defaultExpiryHours = defaultExpiryHours;
    this.origin = origin;
    this.options = options || [];
    options?.forEach((option) => {
      if (option.isCountable) {
        this.countableTypes.push(option.id);
      }
      if (option.isDefault) {
        this.defaultType = option.id;
      }
    });
  }
  isCountable(unit: unitDetails): boolean {
    return (
      COUNTABLE_HOUSEHOLD_STATUS.includes(unit.status as string) &&
      unit.type &&
      unit.type.length > 0 &&
      unit.type.some((type) => this.countableTypes.includes(type.id))
    );
  }
  isCompleted(unit: unitDetails): boolean {
    const tries: number = parseInt(unit.nhcount as string);
    return (
      unit.status === STATUS_CODES.DONE ||
      (unit.status === STATUS_CODES.NOT_HOME && tries >= this.maxTries)
    );
  }
  getUnitColor(unit: unitDetails, progress: number): string {
    return processAvailableColour(
      this.isCompleted(unit),
      this.isCountable(unit),
      progress
    );
  }
  isFromAdmin(): boolean {
    return (
      this.userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE ||
      this.userRole === USER_ACCESS_LEVELS.CONDUCTOR.CODE ||
      this.userRole === USER_ACCESS_LEVELS.READ_ONLY.CODE
    );
  }
  hasOptions(): boolean {
    return this.options.length > 0;
  }
  getOptionMap(): Map<string, HHOptionProps> {
    return new Map(this.options.map((option) => [option.id, option]));
  }
}

export class LinkSession {
  id: string;
  tokenEndtime: number;
  mapId: string;
  maxTries: number;
  linkType: string;
  userId: string;
  congregation: string | undefined;
  tokenCreatetime: number;
  key: string;
  name: string;
  publisherName: string;
  constructor(linkData?: RecordModel, key?: string) {
    this.id = "";
    this.tokenEndtime = 0;
    this.mapId = "";
    this.maxTries = DEFAULT_CONGREGATION_MAX_TRIES;
    this.linkType = LINK_TYPES.ASSIGNMENT;
    this.tokenCreatetime = new Date().getTime();
    this.userId = "";
    this.congregation = "";
    this.key = "";
    this.name = "";
    this.publisherName = "";
    if (!linkData) return;
    this.id = linkData?.id || "";
    this.key = key || "";
    this.userId = linkData.user;
    this.tokenCreatetime = new Date(linkData.created).getTime();
    this.name = linkData.expand?.map.description || "";
    this.publisherName = linkData.publisher;
    this.tokenEndtime = new Date(linkData.expiry_date).getTime();
  }
}

export class LinkDetails {
  assigneeDetailsList: Array<LinkSession>;
  personalDetailsList: Array<LinkSession>;
  constructor() {
    this.assigneeDetailsList = [];
    this.personalDetailsList = [];
  }
}
