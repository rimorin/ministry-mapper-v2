import { Policy, LinkSession, LinkDetails } from "./policies";
import { HHOptionProps, unitDetails } from "./interface";
import {
  STATUS_CODES,
  USER_ACCESS_LEVELS,
  LINK_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION
} from "./constants";
import { describe, expect, it } from "vitest";

describe("Policy class", () => {
  it("should initialize with default values", () => {
    const policy = new Policy();
    expect(policy.userName).toBe("");
    expect(policy.userRole).toBe(USER_ACCESS_LEVELS.CONDUCTOR.CODE);
    expect(policy.maxTries).toBe(DEFAULT_CONGREGATION_MAX_TRIES);
    expect(policy.countableTypes).toEqual([]);
    expect(policy.defaultType).toBe("");
    expect(policy.origin).toBe(DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION);
    expect(policy.options).toEqual([]);
  });

  it("should correctly identify countable units", () => {
    const options: Array<HHOptionProps> = [
      {
        id: "1",
        isCountable: true,
        isDefault: false,
        code: "",
        description: "",
        sequence: 0
      },
      {
        id: "2",
        isCountable: false,
        isDefault: true,
        code: "",
        description: "",
        sequence: 0
      }
    ];
    const policy = new Policy("", options);
    const unit: unitDetails = {
      id: "unit1",
      number: "1",
      note: "",
      dnctime: 0,
      status: STATUS_CODES.NOT_HOME,
      type: [{ id: "1", code: "" }],
      nhcount: "0",
      floor: 0,
      sequence: 0
    };
    expect(policy.isCountable(unit)).toBe(true);
  });

  it("should correctly identify completed units", () => {
    const policy = new Policy();
    const unit: unitDetails = {
      id: "unit1",
      number: "1",
      note: "",
      dnctime: 0,
      status: STATUS_CODES.DONE,
      type: [],
      nhcount: "0",
      floor: 0,
      sequence: 0
    };
    expect(policy.isCompleted(unit)).toBe(true);
  });

  it("should identify if user is from admin", () => {
    const policy = new Policy(
      "",
      [],
      0,
      "",
      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
    );
    expect(policy.isFromAdmin()).toBe(true);
  });

  it("should check if policy has options", () => {
    const options: Array<HHOptionProps> = [
      {
        id: "1",
        isCountable: true,
        isDefault: false,
        code: "",
        description: "",
        sequence: 0
      }
    ];
    const policy = new Policy("", options);
    expect(policy.hasOptions()).toBe(true);
  });
});

describe("LinkSession class", () => {
  it("should initialize with default values", () => {
    const linkSession = new LinkSession();
    expect(linkSession.id).toBe("");
    expect(linkSession.tokenEndtime).toBe(0);
    expect(linkSession.mapId).toBe("");
    expect(linkSession.maxTries).toBe(DEFAULT_CONGREGATION_MAX_TRIES);
    expect(linkSession.linkType).toBe(LINK_TYPES.ASSIGNMENT);
    expect(linkSession.tokenCreatetime).toBeGreaterThan(0);
    expect(linkSession.userId).toBe("");
    expect(linkSession.congregation).toBe("");
    expect(linkSession.key).toBe("");
    expect(linkSession.name).toBe("");
    expect(linkSession.publisherName).toBe("");
  });

  it("should initialize with provided linkData", () => {
    const linkData = {
      id: "123",
      user: "user1",
      created: "2023-01-01T00:00:00Z",
      expand: { map: { description: "Map 1" } },
      publisher: "Publisher 1",
      expiry_date: "2023-12-31T23:59:59Z",
      collectionId: "collection1",
      collectionName: "collectionName1"
    };
    const linkSession = new LinkSession(linkData);
    expect(linkSession.id).toBe("123");
    expect(linkSession.userId).toBe("user1");
    expect(linkSession.tokenCreatetime).toBe(
      new Date(linkData.created).getTime()
    );
    expect(linkSession.name).toBe("Map 1");
    expect(linkSession.publisherName).toBe("Publisher 1");
    expect(linkSession.tokenEndtime).toBe(
      new Date(linkData.expiry_date).getTime()
    );
  });
});

describe("LinkDetails class", () => {
  it("should initialize with empty lists", () => {
    const linkDetails = new LinkDetails();
    expect(linkDetails.assigneeDetailsList).toEqual([]);
    expect(linkDetails.personalDetailsList).toEqual([]);
  });
});
