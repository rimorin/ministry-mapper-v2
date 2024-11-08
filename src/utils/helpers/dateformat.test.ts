import { describe, it, expect } from "vitest";
import formatDate from "./dateformat";

describe("formatDate", () => {
  it("should return 'Invalid Date' for an invalid date string", () => {
    const dateString = "invalid-date";
    const formattedDate = formatDate(dateString);
    expect(formattedDate).toBe("Invalid Date");
  });

  it("should handle empty date string", () => {
    const dateString = "";
    const formattedDate = formatDate(dateString);
    expect(formattedDate).toBe("Invalid Date");
  });
});
