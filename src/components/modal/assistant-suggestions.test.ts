import { describe, it, expect } from "vitest";
import {
  STARTER_COUNT,
  STARTER_QUESTIONS,
  pickStarters
} from "./assistant-suggestions";

const level = { read_only: 1, conductor: 2, administrator: 3 } as const;

describe("pickStarters", () => {
  it("offers each role only questions the assistant answers for it", () => {
    for (const role of ["read_only", "conductor", "administrator"] as const) {
      for (let run = 0; run < 20; run++) {
        const picked = pickStarters(role);
        expect(picked).toHaveLength(STARTER_COUNT);
        expect(new Set(picked.map((q) => q.key)).size).toBe(STARTER_COUNT);
        for (const q of picked) {
          expect(level[q.role as keyof typeof level]).toBeLessThanOrEqual(
            level[role]
          );
        }
      }
    }
  });

  it("shuffles, so different opens can show different questions", () => {
    const seen = new Set<string>();
    for (let run = 0; run < 50; run++) {
      pickStarters("administrator").forEach((q) => seen.add(q.key));
    }
    expect(seen.size).toBeGreaterThan(STARTER_COUNT * 2);
  });

  it("offers nothing to an unknown role", () => {
    expect(pickStarters(undefined)).toEqual([]);
    expect(pickStarters("no_access")).toEqual([]);
  });

  it("has a question for each role and no repeated keys", () => {
    const keys = STARTER_QUESTIONS.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const role of ["read_only", "conductor", "administrator"]) {
      expect(STARTER_QUESTIONS.some((q) => q.role === role)).toBe(true);
    }
  });
});
