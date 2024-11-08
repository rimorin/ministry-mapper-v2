import { describe, it, expect } from "vitest";
import LinkTypeDescription from "./linkdesc";
import { LINK_TYPES } from "../constants";

describe("LinkTypeDescription", () => {
  it('should return "Personal" for LINK_TYPES.PERSONAL', () => {
    expect(LinkTypeDescription(LINK_TYPES.PERSONAL)).toBe("Personal");
  });

  it('should return "Assign" for LINK_TYPES.ASSIGNMENT', () => {
    expect(LinkTypeDescription(LINK_TYPES.ASSIGNMENT)).toBe("Assign");
  });

  it('should return "View" for unknown link types', () => {
    expect(LinkTypeDescription("UNKNOWN_TYPE")).toBe("View");
  });
});
