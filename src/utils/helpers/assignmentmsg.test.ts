import { describe, it, expect, vi } from "vitest";
import assignmentMessage from "./assignmentmsg";

describe("assignmentMessage", () => {
  process.env.TZ = "UTC";

  it("should return morning greeting", () => {
    vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
    expect(assignmentMessage("123 Main St")).toBe(
      "Good Morning!! You are assigned to 123 Main St. Please click on the link below to proceed."
    );
  });

  it("should return afternoon greeting", () => {
    vi.setSystemTime(new Date("2023-01-01T13:00:00Z"));
    expect(assignmentMessage("123 Main St")).toBe(
      "Good Afternoon!! You are assigned to 123 Main St. Please click on the link below to proceed."
    );
  });

  it("should return evening greeting", () => {
    vi.setSystemTime(new Date("2023-01-01T20:00:00Z"));
    expect(assignmentMessage("123 Main St")).toBe(
      "Good Evening!! You are assigned to 123 Main St. Please click on the link below to proceed."
    );
  });

  it("should return morning greeting at 11:59 AM", () => {
    vi.setSystemTime(new Date("2023-01-01T11:59:00Z"));
    expect(assignmentMessage("456 Elm St")).toBe(
      "Good Morning!! You are assigned to 456 Elm St. Please click on the link below to proceed."
    );
  });

  it("should return afternoon greeting at 12:00 PM", () => {
    vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
    expect(assignmentMessage("789 Oak St")).toBe(
      "Good Afternoon!! You are assigned to 789 Oak St. Please click on the link below to proceed."
    );
  });

  it("should return afternoon greeting at 5:00 PM", () => {
    vi.setSystemTime(new Date("2023-01-01T17:00:00Z"));
    expect(assignmentMessage("101 Pine St")).toBe(
      "Good Evening!! You are assigned to 101 Pine St. Please click on the link below to proceed."
    );
  });

  it("should return evening greeting at 5:01 PM", () => {
    vi.setSystemTime(new Date("2023-01-01T17:01:00Z"));
    expect(assignmentMessage("202 Maple St")).toBe(
      "Good Evening!! You are assigned to 202 Maple St. Please click on the link below to proceed."
    );
  });

  it("should return evening greeting at 11:59 PM", () => {
    vi.setSystemTime(new Date("2023-01-01T23:59:00Z"));
    expect(assignmentMessage("303 Birch St")).toBe(
      "Good Evening!! You are assigned to 303 Birch St. Please click on the link below to proceed."
    );
  });
});
