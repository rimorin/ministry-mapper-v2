import { describe, it, expect } from "vitest";
import formatDate from "./dateformat";

describe("formatDate", () => {
  it("spells out the month so the day and month cannot be swapped", () => {
    const formattedDate = formatDate(new Date(2026, 10, 12, 14, 32));
    expect(formattedDate).toBe("Thu, 12 Nov 2026, 2:32 pm");
  });

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
