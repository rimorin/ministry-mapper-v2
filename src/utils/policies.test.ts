import { Policy, LinkSession, LinkDetails } from "./policies";
import { HHOptionProps, unitDetails } from "./interface";
import {
  STATUS_CODES,
  USER_ACCESS_LEVELS,
  LINK_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
  DEFAULT_SELF_DESTRUCT_HOURS
} from "./constants";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("Policy class", () => {
  let mockOptions: Array<HHOptionProps>;

  beforeEach(() => {
    mockOptions = [
      {
        id: "1",
        isCountable: true,
        isDefault: false,
        code: "type1",
        description: "Type 1",
        sequence: 1
      },
      {
        id: "2",
        isCountable: false,
        isDefault: true,
        code: "type2",
        description: "Type 2",
        sequence: 2
      },
      {
        id: "3",
        isCountable: true,
        isDefault: false,
        code: "type3",
        description: "Type 3",
        sequence: 3
      }
    ];
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      const policy = new Policy();
      expect(policy.userName).toBe("");
      expect(policy.userRole).toBe(USER_ACCESS_LEVELS.CONDUCTOR.CODE);
      expect(policy.maxTries).toBe(DEFAULT_CONGREGATION_MAX_TRIES);
      expect(policy.countableTypes).toEqual([]);
      expect(policy.defaultType).toBe("");
      expect(policy.origin).toBe(DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION);
      expect(policy.options).toEqual([]);
      expect(policy.defaultExpiryHours).toBe(DEFAULT_SELF_DESTRUCT_HOURS);
    });

    it("should initialize with provided parameters", () => {
      const userName = "testUser";
      const maxTries = 5;
      const origin = "custom_origin";
      const userRole = USER_ACCESS_LEVELS.PUBLISHER.CODE;
      const defaultExpiryHours = 48;

      const policy = new Policy(
        userName,
        mockOptions,
        maxTries,
        origin,
        userRole,
        defaultExpiryHours
      );

      expect(policy.userName).toBe(userName);
      expect(policy.userRole).toBe(userRole);
      expect(policy.maxTries).toBe(maxTries);
      expect(policy.origin).toBe(origin);
      expect(policy.defaultExpiryHours).toBe(defaultExpiryHours);
      expect(policy.options).toEqual(mockOptions);
    });

    it("should correctly process countable types from options", () => {
      const policy = new Policy("", mockOptions);
      expect(policy.countableTypes).toEqual(["1", "3"]);
    });

    it("should correctly identify default type from options", () => {
      const policy = new Policy("", mockOptions);
      expect(policy.defaultType).toBe("2");
    });

    it("should handle empty options array", () => {
      const policy = new Policy("", []);
      expect(policy.countableTypes).toEqual([]);
      expect(policy.defaultType).toBe("");
    });
  });

  describe("isCountable", () => {
    let policy: Policy;

    beforeEach(() => {
      policy = new Policy("", mockOptions);
    });

    it("should return true for countable units with valid status and type", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DONE,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCountable(unit)).toBe(true);
    });

    it("should return true for units with NOT_HOME status", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCountable(unit)).toBe(true);
    });

    it("should return true for units with DEFAULT status", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DEFAULT,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCountable(unit)).toBe(true);
    });

    it("should return false for units with non-countable status", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DO_NOT_CALL,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCountable(unit)).toBe(false);
    });

    it("should return false for units with non-countable type", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DONE,
        type: [{ id: "2", code: "type2" }], // type "2" is not countable
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCountable(unit)).toBe(false);
    });

    it("should return false for units with empty type array", () => {
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
      expect(policy.isCountable(unit)).toBe(false);
    });

    it("should return false for units with null/undefined type", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DONE,
        type: null as unknown as { id: string; code: string }[],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(Boolean(policy.isCountable(unit))).toBe(false);
    });

    it("should handle multiple types with mixed countability", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DONE,
        type: [
          { id: "2", code: "type2" }, // not countable
          { id: "1", code: "type1" } // countable
        ],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCountable(unit)).toBe(true);
    });
  });

  describe("isCompleted", () => {
    it("should return true for units with DONE status", () => {
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

    it("should return true for NOT_HOME units exceeding max tries", () => {
      const policy = new Policy("", [], 2); // maxTries = 2
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [],
        nhcount: "3", // exceeds maxTries
        floor: 0,
        sequence: 0
      };
      expect(policy.isCompleted(unit)).toBe(true);
    });

    it("should return true for NOT_HOME units meeting max tries exactly", () => {
      const policy = new Policy("", [], 3); // maxTries = 3
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [],
        nhcount: "3", // equals maxTries
        floor: 0,
        sequence: 0
      };
      expect(policy.isCompleted(unit)).toBe(true);
    });

    it("should return false for NOT_HOME units below max tries", () => {
      const policy = new Policy("", [], 3); // maxTries = 3
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [],
        nhcount: "2", // below maxTries
        floor: 0,
        sequence: 0
      };
      expect(policy.isCompleted(unit)).toBe(false);
    });

    it("should return false for units with DEFAULT status", () => {
      const policy = new Policy();
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DEFAULT,
        type: [],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.isCompleted(unit)).toBe(false);
    });

    it("should handle non-numeric nhcount values", () => {
      const policy = new Policy("", [], 2);
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [],
        nhcount: "invalid", // non-numeric
        floor: 0,
        sequence: 0
      };
      // parseInt("invalid") returns NaN, which when compared with >= will be false
      expect(policy.isCompleted(unit)).toBe(false);
    });
  });

  describe("getUnitColor", () => {
    let policy: Policy;

    beforeEach(() => {
      policy = new Policy("", mockOptions);
    });

    it("should return empty string for completed units", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DONE,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.getUnitColor(unit, 50)).toBe("");
    });

    it("should return empty string for non-countable units", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DONE,
        type: [{ id: "2", code: "type2" }], // non-countable
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.getUnitColor(unit, 50)).toBe("");
    });

    it("should return 'available' for countable incomplete units with low progress", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DEFAULT,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.getUnitColor(unit, 50)).toBe("available");
    });

    it("should return 'available cell-highlight' for countable incomplete units with high progress", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DEFAULT,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.getUnitColor(unit, 95)).toBe("available cell-highlight");
    });

    it("should handle edge case at 90% progress", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DEFAULT,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.getUnitColor(unit, 90)).toBe("available cell-highlight");
    });

    it("should handle edge case just below 90% progress", () => {
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.DEFAULT,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };
      expect(policy.getUnitColor(unit, 89)).toBe("available");
    });
  });

  describe("isFromAdmin", () => {
    it("should return true for TERRITORY_SERVANT role", () => {
      const policy = new Policy(
        "",
        [],
        0,
        "",
        USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
      );
      expect(policy.isFromAdmin()).toBe(true);
    });

    it("should return true for CONDUCTOR role", () => {
      const policy = new Policy(
        "",
        [],
        0,
        "",
        USER_ACCESS_LEVELS.CONDUCTOR.CODE
      );
      expect(policy.isFromAdmin()).toBe(true);
    });

    it("should return true for READ_ONLY role", () => {
      const policy = new Policy(
        "",
        [],
        0,
        "",
        USER_ACCESS_LEVELS.READ_ONLY.CODE
      );
      expect(policy.isFromAdmin()).toBe(true);
    });

    it("should return false for PUBLISHER role", () => {
      const policy = new Policy(
        "",
        [],
        0,
        "",
        USER_ACCESS_LEVELS.PUBLISHER.CODE
      );
      expect(policy.isFromAdmin()).toBe(false);
    });

    it("should return false for NO_ACCESS role", () => {
      const policy = new Policy(
        "",
        [],
        0,
        "",
        USER_ACCESS_LEVELS.NO_ACCESS.CODE
      );
      expect(policy.isFromAdmin()).toBe(false);
    });

    it("should return false for unknown role", () => {
      const policy = new Policy("", [], 0, "", "unknown_role");
      expect(policy.isFromAdmin()).toBe(false);
    });
  });

  describe("hasOptions", () => {
    it("should return true when options exist", () => {
      const policy = new Policy("", mockOptions);
      expect(policy.hasOptions()).toBe(true);
    });

    it("should return false when options array is empty", () => {
      const policy = new Policy("", []);
      expect(policy.hasOptions()).toBe(false);
    });

    it("should return false when no options provided", () => {
      const policy = new Policy();
      expect(policy.hasOptions()).toBe(false);
    });
  });
});

describe("LinkSession class", () => {
  beforeEach(() => {
    // Mock Date.now() to ensure consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-06-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should initialize with default values when no parameters provided", () => {
      const linkSession = new LinkSession();
      expect(linkSession.id).toBe("");
      expect(linkSession.tokenEndtime).toBe(0);
      expect(linkSession.mapId).toBe("");
      expect(linkSession.maxTries).toBe(DEFAULT_CONGREGATION_MAX_TRIES);
      expect(linkSession.linkType).toBe(LINK_TYPES.ASSIGNMENT);
      expect(linkSession.tokenCreatetime).toBe(
        new Date("2023-06-15T10:00:00Z").getTime()
      );
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
      const key = "testKey";
      const linkSession = new LinkSession(linkData, key);

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
      expect(linkSession.key).toBe(key);
    });

    it("should handle linkData with missing optional fields", () => {
      const linkData = {
        id: "123",
        user: "user1",
        created: "2023-01-01T00:00:00Z",
        publisher: "Publisher 1",
        expiry_date: "2023-12-31T23:59:59Z",
        collectionId: "collection1",
        collectionName: "collectionName1"
      };
      const linkSession = new LinkSession(linkData);

      expect(linkSession.id).toBe("123");
      expect(linkSession.name).toBe(""); // No expand.map.description
      expect(linkSession.key).toBe("");
    });

    it("should handle linkData with expand but no map property", () => {
      const linkData = {
        id: "123",
        user: "user1",
        created: "2023-01-01T00:00:00Z",
        expand: { map: {} },
        publisher: "Publisher 1",
        expiry_date: "2023-12-31T23:59:59Z",
        collectionId: "collection1",
        collectionName: "collectionName1"
      };
      const linkSession = new LinkSession(linkData);

      expect(linkSession.name).toBe("");
    });

    it("should correctly parse date strings", () => {
      const linkData = {
        id: "123",
        user: "user1",
        created: "2023-01-01T12:30:45Z",
        expand: { map: { description: "Map 1" } },
        publisher: "Publisher 1",
        expiry_date: "2023-12-31T23:59:59Z",
        collectionId: "collection1",
        collectionName: "collectionName1"
      };
      const linkSession = new LinkSession(linkData);

      expect(linkSession.tokenCreatetime).toBe(
        new Date("2023-01-01T12:30:45Z").getTime()
      );
      expect(linkSession.tokenEndtime).toBe(
        new Date("2023-12-31T23:59:59Z").getTime()
      );
    });

    it("should use current time when no linkData provided", () => {
      const linkSession = new LinkSession();
      const expectedTime = new Date("2023-06-15T10:00:00Z").getTime();

      expect(linkSession.tokenCreatetime).toBe(expectedTime);
    });
  });
});

describe("LinkDetails class", () => {
  describe("constructor", () => {
    it("should initialize with empty lists", () => {
      const linkDetails = new LinkDetails();
      expect(linkDetails.assigneeDetailsList).toEqual([]);
      expect(linkDetails.personalDetailsList).toEqual([]);
    });

    it("should initialize arrays as separate instances", () => {
      const linkDetails1 = new LinkDetails();
      const linkDetails2 = new LinkDetails();

      // Verify they are separate instances
      expect(linkDetails1.assigneeDetailsList).not.toBe(
        linkDetails2.assigneeDetailsList
      );
      expect(linkDetails1.personalDetailsList).not.toBe(
        linkDetails2.personalDetailsList
      );
    });

    it("should allow modification of arrays after initialization", () => {
      const linkDetails = new LinkDetails();
      const mockLinkSession = new LinkSession();

      // Test that arrays can be modified
      linkDetails.assigneeDetailsList.push(mockLinkSession);
      linkDetails.personalDetailsList.push(mockLinkSession);

      expect(linkDetails.assigneeDetailsList).toHaveLength(1);
      expect(linkDetails.personalDetailsList).toHaveLength(1);
      expect(linkDetails.assigneeDetailsList[0]).toBe(mockLinkSession);
      expect(linkDetails.personalDetailsList[0]).toBe(mockLinkSession);
    });
  });
});

describe("Integration tests", () => {
  describe("Policy with LinkSession", () => {
    it("should work together in realistic scenarios", () => {
      // Create a policy with comprehensive options
      const options: Array<HHOptionProps> = [
        {
          id: "residential",
          isCountable: true,
          isDefault: true,
          code: "R",
          description: "Residential",
          sequence: 1
        },
        {
          id: "commercial",
          isCountable: false,
          isDefault: false,
          code: "C",
          description: "Commercial",
          sequence: 2
        }
      ];

      const policy = new Policy(
        "Test User",
        options,
        3,
        "Singapore",
        USER_ACCESS_LEVELS.CONDUCTOR.CODE
      );

      // Create multiple units with different scenarios
      const units: unitDetails[] = [
        {
          id: "unit1",
          number: "1",
          note: "",
          dnctime: 0,
          status: STATUS_CODES.DEFAULT,
          type: [{ id: "residential", code: "R" }],
          nhcount: "0",
          floor: 1,
          sequence: 1
        },
        {
          id: "unit2",
          number: "2",
          note: "",
          dnctime: 0,
          status: STATUS_CODES.NOT_HOME,
          type: [{ id: "residential", code: "R" }],
          nhcount: "2",
          floor: 1,
          sequence: 2
        },
        {
          id: "unit3",
          number: "3",
          note: "",
          dnctime: 0,
          status: STATUS_CODES.DONE,
          type: [{ id: "residential", code: "R" }],
          nhcount: "1",
          floor: 1,
          sequence: 3
        },
        {
          id: "unit4",
          number: "4",
          note: "",
          dnctime: 0,
          status: STATUS_CODES.NOT_HOME,
          type: [{ id: "residential", code: "R" }],
          nhcount: "3",
          floor: 1,
          sequence: 4
        }
      ];

      // Test countability
      expect(policy.isCountable(units[0])).toBe(true); // Default status, countable type
      expect(policy.isCountable(units[1])).toBe(true); // Not home, countable type
      expect(policy.isCountable(units[2])).toBe(true); // Done, countable type
      expect(policy.isCountable(units[3])).toBe(true); // Not home, countable type

      // Test completion status
      expect(policy.isCompleted(units[0])).toBe(false); // Default status
      expect(policy.isCompleted(units[1])).toBe(false); // Not home, below max tries
      expect(policy.isCompleted(units[2])).toBe(true); // Done status
      expect(policy.isCompleted(units[3])).toBe(true); // Not home, at max tries

      // Test color coding
      expect(policy.getUnitColor(units[0], 50)).toBe("available");
      expect(policy.getUnitColor(units[0], 95)).toBe(
        "available cell-highlight"
      );
      expect(policy.getUnitColor(units[2], 50)).toBe(""); // Completed unit
      expect(policy.getUnitColor(units[3], 50)).toBe(""); // Completed unit

      // Test policy properties
      expect(policy.hasOptions()).toBe(true);
      expect(policy.isFromAdmin()).toBe(true);
      expect(policy.defaultType).toBe("residential");
      expect(policy.countableTypes).toEqual(["residential"]);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle invalid status codes gracefully", () => {
      const policy = new Policy();
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: "invalid_status" as string,
        type: [{ id: "1", code: "type1" }],
        nhcount: "0",
        floor: 0,
        sequence: 0
      };

      // Should not crash and return false for unknown status
      expect(policy.isCountable(unit)).toBe(false);
      expect(policy.isCompleted(unit)).toBe(false);
    });

    it("should handle extreme values gracefully", () => {
      const policy = new Policy("", [], 999999);
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [],
        nhcount: "999999",
        floor: 0,
        sequence: 0
      };

      expect(policy.isCompleted(unit)).toBe(true);
    });

    it("should handle negative nhcount values", () => {
      const policy = new Policy("", [], 3);
      const unit: unitDetails = {
        id: "unit1",
        number: "1",
        note: "",
        dnctime: 0,
        status: STATUS_CODES.NOT_HOME,
        type: [],
        nhcount: "-1",
        floor: 0,
        sequence: 0
      };

      expect(policy.isCompleted(unit)).toBe(false);
    });
  });
});
