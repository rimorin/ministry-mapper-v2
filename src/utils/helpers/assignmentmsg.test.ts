import { describe, it, expect, vi } from "vitest";
import assignmentMessage, { formatExpiry } from "./assignmentmsg";

describe("formatExpiry", () => {
  it("returns '1 hour' for 1 hour", () => {
    expect(formatExpiry(1)).toBe("1 hour");
  });

  it("returns '1 hour' for values <= 1", () => {
    expect(formatExpiry(0)).toBe("1 hour");
    expect(formatExpiry(0.5)).toBe("1 hour");
  });

  it("returns '1 hour' for invalid inputs (NaN, Infinity, negative)", () => {
    expect(formatExpiry(NaN)).toBe("1 hour");
    expect(formatExpiry(Infinity)).toBe("1 hour");
    expect(formatExpiry(-5)).toBe("1 hour");
  });

  it("returns hours for 2–23 hours", () => {
    expect(formatExpiry(2)).toBe("2 hours");
    expect(formatExpiry(8)).toBe("8 hours");
    expect(formatExpiry(12)).toBe("12 hours");
    expect(formatExpiry(23)).toBe("23 hours");
  });

  it("returns '1 day' for 24–47 hours", () => {
    expect(formatExpiry(24)).toBe("1 day");
    expect(formatExpiry(47)).toBe("1 day");
  });

  it("returns days for 48–167 hours", () => {
    expect(formatExpiry(48)).toBe("2 days");
    expect(formatExpiry(72)).toBe("3 days");
    expect(formatExpiry(167)).toBe("6 days");
  });

  it("returns '1 week' for 168–335 hours", () => {
    expect(formatExpiry(168)).toBe("1 week");
    expect(formatExpiry(335)).toBe("1 week");
  });

  it("returns weeks for 336–719 hours", () => {
    expect(formatExpiry(336)).toBe("2 weeks");
    expect(formatExpiry(504)).toBe("3 weeks");
    expect(formatExpiry(672)).toBe("4 weeks");
    expect(formatExpiry(719)).toBe("4 weeks");
  });

  it("returns '1 month' for 720–1439 hours", () => {
    expect(formatExpiry(720)).toBe("1 month");
    expect(formatExpiry(1439)).toBe("1 month");
  });

  it("returns months for 1440+ hours", () => {
    expect(formatExpiry(1440)).toBe("2 months");
    expect(formatExpiry(2160)).toBe("3 months");
  });
});

describe("assignmentMessage", () => {
  process.env.TZ = "UTC";

  it("should return morning greeting for normal assignment", () => {
    vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
    expect(assignmentMessage("123 Main St", "John")).toBe(
      "Good Morning, John!!\n\nYou are assigned to 123 Main St.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return afternoon greeting for normal assignment", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(assignmentMessage("123 Main St", "John")).toBe(
      "Good Afternoon, John!!\n\nYou are assigned to 123 Main St.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return evening greeting for normal assignment", () => {
    vi.setSystemTime(new Date("2023-01-01T20:00:00Z"));
    expect(assignmentMessage("123 Main St", "John")).toBe(
      "Good Evening, John!!\n\nYou are assigned to 123 Main St.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return morning greeting at 11:59 AM", () => {
    vi.setSystemTime(new Date("2023-01-01T11:59:00Z"));
    expect(assignmentMessage("456 Elm St", "Sarah")).toBe(
      "Good Morning, Sarah!!\n\nYou are assigned to 456 Elm St.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return afternoon greeting at 12:00 PM", () => {
    vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
    expect(assignmentMessage("789 Oak St", "Mary")).toBe(
      "Good Afternoon, Mary!!\n\nYou are assigned to 789 Oak St.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return evening greeting at 5:00 PM", () => {
    vi.setSystemTime(new Date("2023-01-01T17:00:00Z"));
    expect(assignmentMessage("101 Pine St", "Peter")).toBe(
      "Good Evening, Peter!!\n\nYou are assigned to 101 Pine St.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return personal slip with hours expiry", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(assignmentMessage("718 Woodlands Dr", "Sarah", 4, "personal")).toBe(
      "Good Afternoon, Sarah!!\n\nYou have a personal slip for 718 Woodlands Dr.\n\nThis link expires in 4 hours.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return personal slip with singular hour", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(assignmentMessage("718 Woodlands Dr", "Sarah", 1, "personal")).toBe(
      "Good Afternoon, Sarah!!\n\nYou have a personal slip for 718 Woodlands Dr.\n\nThis link expires in 1 hour.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return personal slip with days expiry", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(assignmentMessage("718 Woodlands Dr", "Sarah", 48, "personal")).toBe(
      "Good Afternoon, Sarah!!\n\nYou have a personal slip for 718 Woodlands Dr.\n\nThis link expires in 2 days.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return personal slip with weeks expiry", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(
      assignmentMessage("718 Woodlands Dr", "Sarah", 336, "personal")
    ).toBe(
      "Good Afternoon, Sarah!!\n\nYou have a personal slip for 718 Woodlands Dr.\n\nThis link expires in 2 weeks.\n\nPlease click on the link below to proceed."
    );
  });

  it("should return personal slip with months expiry", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(
      assignmentMessage("718 Woodlands Dr", "Sarah", 1440, "personal")
    ).toBe(
      "Good Afternoon, Sarah!!\n\nYou have a personal slip for 718 Woodlands Dr.\n\nThis link expires in 2 months.\n\nPlease click on the link below to proceed."
    );
  });
});
