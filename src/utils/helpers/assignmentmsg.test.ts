import { describe, it, expect, vi } from "vitest";
import assignmentMessage from "./assignmentmsg";

describe("assignmentMessage", () => {
  it("should return morning greeting", () => {
    vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
    expect(assignmentMessage("123 Main St")).toBe(
      "Good Morning!! You are assigned to 123 Main St. Please click on the link below to proceed."
    );
  });

  it("should return afternoon greeting", () => {
    vi.setSystemTime(new Date("2023-01-01T06:00:00Z"));
    expect(assignmentMessage("123 Main St")).toBe(
      "Good Afternoon!! You are assigned to 123 Main St. Please click on the link below to proceed."
    );
  });

  it("should return evening greeting", () => {
    vi.setSystemTime(new Date("2023-01-01T11:00:00Z"));
    expect(assignmentMessage("123 Main St")).toBe(
      "Good Evening!! You are assigned to 123 Main St. Please click on the link below to proceed."
    );
  });
});
