import { IdTokenResult } from "firebase/auth";
import {
  NOT_HOME_STATUS_CODES,
  COUNTABLE_HOUSEHOLD_STATUS,
  STATUS_CODES,
  LINK_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE,
  DEFAULT_MULTPLE_OPTION_DELIMITER
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
  maxTries: number;
  countableTypes: Array<string>;
  defaultType: string;
  isMultiselect: boolean;
  constructor(
    userData?: IdTokenResult,
    options?: Array<HHOptionProps>,
    maxtries = NOT_HOME_STATUS_CODES.SECOND_TRY,
    isMultiselect = DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE
  ) {
    this.maxTries = maxtries;
    this.countableTypes = [];
    this.defaultType = "";
    this.isMultiselect = isMultiselect;
    options?.forEach((option) => {
      if (option.isCountable) {
        this.countableTypes.push(option.code);
      }
      if (option.isDefault) {
        this.defaultType = option.code;
      }
    });
    if (!userData) return;
    const userClaims = userData.claims;
    // check for customised user max tries and countable types
    if (!userClaims) return;
    if (userClaims.maxTries !== undefined) {
      this.maxTries = userClaims.maxTries;
    }
    if (userClaims.countableTypes !== undefined) {
      this.countableTypes = userClaims.countableTypes;
    }
  }
  isCountable(unit: unitDetails): boolean {
    if (this.isMultiselect) {
      const multipleTypes = unit.type.split(DEFAULT_MULTPLE_OPTION_DELIMITER);
      return (
        COUNTABLE_HOUSEHOLD_STATUS.includes(unit.status) &&
        multipleTypes.some((type) => this.countableTypes.includes(type))
      );
    }
    return (
      COUNTABLE_HOUSEHOLD_STATUS.includes(unit.status) &&
      this.countableTypes.includes(unit.type as string)
    );
  }
  isCompleted(unit: unitDetails): boolean {
    const tries = unit.nhcount;
    const status = unit.status;
    return (
      status == STATUS_CODES.DONE ||
      (status == STATUS_CODES.NOT_HOME && tries >= this.maxTries)
    );
  }
  getUnitColor(unit: unitDetails, progress: number): string {
    return processAvailableColour(
      this.isCompleted(unit),
      this.isCountable(unit),
      progress
    );
  }
}

export class LinkSession {
  endDate: number;
  map: string;
  maxTries: number;
  type: number;
  user: string;
  congregation: string;
  createDate: number;
  key: string;
  name: string;
  publisherName: string;
  territory: string;
  lowestFloor: number;
  highestFloor: number;
  lowestSequence: number;
  highestSequence: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(linkData?: any, key?: string) {
    this.endDate = 0;
    this.map = "";
    this.territory = "";
    this.maxTries = DEFAULT_CONGREGATION_MAX_TRIES;
    this.type = LINK_TYPES.VIEW;
    this.createDate = new Date().getTime();
    this.user = "";
    this.congregation = "";
    this.key = "";
    this.name = "";
    this.publisherName = "";
    this.lowestFloor = 0;
    this.highestFloor = 0;
    this.lowestSequence = 0;
    this.highestSequence = 0;
    if (!linkData) return;
    this.key = key || "";
    this.user = linkData.user;
    this.createDate = linkData.createDate;
    this.congregation = linkData.congregation;
    this.name = linkData.name;
    this.publisherName = linkData.publisherName;
    this.endDate = linkData.endDate;
    this.map = linkData.map;
    this.type = linkData.type;
    this.maxTries = linkData.maxTries;
    this.territory = linkData.territory;
    this.lowestFloor = linkData.lowestFloor || 0;
    this.highestFloor = linkData.highestFloor || 0;
    this.lowestSequence = linkData.lowestSequence || 0;
    this.highestSequence = linkData.highestSequence || 0;
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
