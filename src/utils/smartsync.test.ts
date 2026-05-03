import { describe, it, expect, beforeEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import type { QueuedOp, unitDetails } from "./interface";

// ── Factories ──────────────────────────────────────────────────────────────────

const defaultUpdateData: QueuedOp["updateData"] = {
  notes: "",
  status: "X",
  not_home_tries: 0,
  dnc_time: "",
  coordinates: null,
  updated_by: "user-1"
};

const makeOp = (overrides: Partial<QueuedOp> = {}): QueuedOp => ({
  addressId: "addr-1",
  assignmentId: "map-1",
  congregation: "cong-1",
  updateData: defaultUpdateData,
  initialOptionIds: [],
  desiredOptionIds: [],
  ts: 1000,
  ...overrides
});

const makeUnit = (overrides: Partial<unitDetails> = {}): unitDetails => ({
  id: "addr-1",
  number: "1",
  note: "",
  type: [],
  status: "X",
  nhcount: "0",
  dnctime: 0,
  floor: 1,
  sequence: 1,
  ...overrides
});

// ── Test suite ─────────────────────────────────────────────────────────────────

describe("smartsync utils", () => {
  // Re-import the module fresh for each test to reset the IDB singleton, and
  // delete the fake IDB database so each test starts with an empty store.
  let mod: typeof import("./smartsync");

  beforeEach(async () => {
    // A fresh IDBFactory per test avoids blocked-connection issues that come
    // from trying to deleteDatabase() against an open connection from the
    // previous test. vi.resetModules() resets the dbPromise singleton so the
    // freshly imported module opens its connection against the new factory.
    globalThis.indexedDB = new IDBFactory();
    vi.resetModules();
    mod = await import("./smartsync");
    localStorage.clear();
  });

  // ── enqueueOp ────────────────────────────────────────────────────────────────

  describe("enqueueOp", () => {
    it("stores op with opKey = assignmentId:addressId", async () => {
      await mod.enqueueOp(
        makeOp({ assignmentId: "map-1", addressId: "addr-1" })
      );
      const queue = await mod.getQueue("map-1");
      expect(queue).toHaveLength(1);
      expect(queue[0].opKey).toBe("map-1:addr-1");
    });

    it("upserts: second write for same address replaces first (latest write wins)", async () => {
      await mod.enqueueOp(
        makeOp({ ts: 1, updateData: { ...defaultUpdateData, status: "X" } })
      );
      await mod.enqueueOp(
        makeOp({ ts: 2, updateData: { ...defaultUpdateData, status: "Y" } })
      );
      const queue = await mod.getQueue("map-1");
      expect(queue).toHaveLength(1);
      expect(queue[0].updateData.status).toBe("Y");
    });

    it("upserts: preserves initialOptionIds from first op to keep server baseline", async () => {
      // Edit 1 offline: server has [A], publisher changes to [B]
      await mod.enqueueOp(
        makeOp({ initialOptionIds: ["A"], desiredOptionIds: ["B"] })
      );
      // Edit 2 offline: publisher sees optimistic [B], changes to [C]
      // initialOptionIds from optimistic state is [B] — but we must keep [A]
      await mod.enqueueOp(
        makeOp({ initialOptionIds: ["B"], desiredOptionIds: ["C"] })
      );
      const [stored] = await mod.getQueue("map-1");
      // initialOptionIds must still be [A] (true server baseline)
      expect(stored.initialOptionIds).toEqual(["A"]);
      // desiredOptionIds must be [C] (latest desired state)
      expect(stored.desiredOptionIds).toEqual(["C"]);
    });

    it("stores multiple ops for different addresses independently", async () => {
      await mod.enqueueOp(makeOp({ addressId: "addr-1" }));
      await mod.enqueueOp(makeOp({ addressId: "addr-2" }));
      const queue = await mod.getQueue("map-1");
      expect(queue).toHaveLength(2);
    });

    it("preserves all op fields", async () => {
      const op = makeOp({
        initialOptionIds: ["opt-a"],
        desiredOptionIds: ["opt-b"],
        ts: 42
      });
      await mod.enqueueOp(op);
      const [stored] = await mod.getQueue("map-1");
      expect(stored.initialOptionIds).toEqual(["opt-a"]);
      expect(stored.desiredOptionIds).toEqual(["opt-b"]);
      expect(stored.ts).toBe(42);
    });
  });

  // ── getQueue ──────────────────────────────────────────────────────────────────

  describe("getQueue", () => {
    it("returns empty array when no ops queued", async () => {
      expect(await mod.getQueue("map-1")).toEqual([]);
    });

    it("returns only ops for the given assignmentId", async () => {
      await mod.enqueueOp(
        makeOp({ assignmentId: "map-1", addressId: "addr-1" })
      );
      await mod.enqueueOp(
        makeOp({ assignmentId: "map-2", addressId: "addr-2" })
      );
      const queue = await mod.getQueue("map-1");
      expect(queue).toHaveLength(1);
      expect(queue[0].assignmentId).toBe("map-1");
    });

    it("returns all ops for the given assignmentId", async () => {
      await mod.enqueueOp(makeOp({ addressId: "addr-1" }));
      await mod.enqueueOp(makeOp({ addressId: "addr-2" }));
      await mod.enqueueOp(makeOp({ addressId: "addr-3" }));
      expect(await mod.getQueue("map-1")).toHaveLength(3);
    });
  });

  // ── removeFromQueue ───────────────────────────────────────────────────────────

  describe("removeFromQueue", () => {
    it("removes the op by opKey", async () => {
      await mod.enqueueOp(
        makeOp({ assignmentId: "map-1", addressId: "addr-1" })
      );
      await mod.removeFromQueue("map-1:addr-1");
      expect(await mod.getQueue("map-1")).toHaveLength(0);
    });

    it("does not throw for a non-existent opKey", async () => {
      await expect(
        mod.removeFromQueue("does-not-exist")
      ).resolves.not.toThrow();
    });

    it("only removes the targeted op, leaving others intact", async () => {
      await mod.enqueueOp(makeOp({ addressId: "addr-1" }));
      await mod.enqueueOp(makeOp({ addressId: "addr-2" }));
      await mod.removeFromQueue("map-1:addr-1");
      const remaining = await mod.getQueue("map-1");
      expect(remaining).toHaveLength(1);
      expect(remaining[0].addressId).toBe("addr-2");
    });
  });

  // ── incrementFailCount ────────────────────────────────────────────────────────

  describe("incrementFailCount", () => {
    it("increments failCount from 0 to 1 on first call", async () => {
      await mod.enqueueOp(makeOp());
      const count = await mod.incrementFailCount("map-1:addr-1");
      expect(count).toBe(1);
    });

    it("increments failCount from 1 to 2 on second call", async () => {
      await mod.enqueueOp(makeOp());
      await mod.incrementFailCount("map-1:addr-1");
      const count = await mod.incrementFailCount("map-1:addr-1");
      expect(count).toBe(2);
    });

    it("returns 0 for a non-existent opKey (op may have been removed)", async () => {
      const count = await mod.incrementFailCount("non-existent:key");
      expect(count).toBe(0);
    });

    it("persists the updated failCount so getQueue reflects it", async () => {
      await mod.enqueueOp(makeOp());
      await mod.incrementFailCount("map-1:addr-1");
      await mod.incrementFailCount("map-1:addr-1");
      const [op] = await mod.getQueue("map-1");
      expect(op.failCount).toBe(2);
    });
  });

  // ── saveAddressCache / loadAddressCache ───────────────────────────────────────

  describe("saveAddressCache / loadAddressCache", () => {
    it("roundtrip: saved data can be loaded back", async () => {
      const data = { "addr-1": makeUnit() };
      await mod.saveAddressCache("map-1", data);
      const result = await mod.loadAddressCache("map-1");
      expect(result).not.toBeNull();
      expect(result!.data).toEqual(data);
    });

    it("saveAddressCache sets cachedAt to approximately now", async () => {
      const before = Date.now();
      await mod.saveAddressCache("map-1", {});
      const after = Date.now();
      const result = await mod.loadAddressCache("map-1");
      expect(result!.cachedAt).toBeGreaterThanOrEqual(before);
      expect(result!.cachedAt).toBeLessThanOrEqual(after);
    });

    it("returns null for a non-existent key", async () => {
      expect(await mod.loadAddressCache("unknown-map")).toBeNull();
    });

    it("returns null and deletes entry when cachedAt is 0 (legacy expired marker)", async () => {
      const spy = vi.spyOn(Date, "now").mockReturnValue(0);
      await mod.saveAddressCache("map-1", {});
      spy.mockRestore();

      expect(await mod.loadAddressCache("map-1")).toBeNull();

      // Entry should have been deleted — saving fresh data must not conflict
      await mod.saveAddressCache("map-1", { "addr-1": makeUnit() });
      expect(await mod.loadAddressCache("map-1")).not.toBeNull();
    });

    it("returns null and deletes entry when cache is older than 7 days", async () => {
      await mod.saveAddressCache("map-1", {});
      const spy = vi
        .spyOn(Date, "now")
        .mockReturnValue(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const result = await mod.loadAddressCache("map-1");
      spy.mockRestore();
      expect(result).toBeNull();
    });

    it("returns data when cache is within the 7-day TTL (6 days old)", async () => {
      await mod.saveAddressCache("map-1", {});
      const spy = vi
        .spyOn(Date, "now")
        .mockReturnValue(Date.now() + 6 * 24 * 60 * 60 * 1000);
      const result = await mod.loadAddressCache("map-1");
      spy.mockRestore();
      expect(result).not.toBeNull();
    });

    it("isolates caches: loading one key does not affect another", async () => {
      await mod.saveAddressCache("map-1", {
        "addr-1": makeUnit({ id: "addr-1" })
      });
      await mod.saveAddressCache("map-2", {
        "addr-9": makeUnit({ id: "addr-9" })
      });
      const r1 = await mod.loadAddressCache("map-1");
      const r2 = await mod.loadAddressCache("map-2");
      expect(Object.keys(r1!.data!)).toEqual(["addr-1"]);
      expect(Object.keys(r2!.data!)).toEqual(["addr-9"]);
    });
  });

  // ── saveAssignmentCache / loadAssignmentCache ─────────────────────────────────

  describe("saveAssignmentCache / loadAssignmentCache", () => {
    it("roundtrip: save and load returns the same object", () => {
      mod.saveAssignmentCache("link-1", { name: "Territory A" });
      const result = mod.loadAssignmentCache<{ name: string }>("link-1");
      expect(result).toEqual({ name: "Territory A" });
    });

    it("returns null for a non-existent key", () => {
      expect(mod.loadAssignmentCache("unknown")).toBeNull();
    });

    it("returns null on corrupted JSON (graceful fallback)", () => {
      localStorage.setItem("mm-assignment-link-1", "not-valid-json{{{");
      expect(mod.loadAssignmentCache("link-1")).toBeNull();
    });

    it("overwrites previous value when saved again", () => {
      mod.saveAssignmentCache("link-1", { name: "Old" });
      mod.saveAssignmentCache("link-1", { name: "New" });
      const result = mod.loadAssignmentCache<{ name: string }>("link-1");
      expect(result!.name).toBe("New");
    });

    it("stores data with cachedAt timestamp in localStorage", () => {
      const before = Date.now();
      mod.saveAssignmentCache("link-1", { name: "Territory A" });
      const after = Date.now();
      const raw = localStorage.getItem("mm-assignment-link-1");
      const parsed = JSON.parse(raw!);
      expect(parsed.cachedAt).toBeGreaterThanOrEqual(before);
      expect(parsed.cachedAt).toBeLessThanOrEqual(after);
      expect(parsed.data).toEqual({ name: "Territory A" });
    });

    it("returns null and removes entry when cache is older than 7 days", () => {
      mod.saveAssignmentCache("link-1", { name: "Territory A" });
      const spy = vi
        .spyOn(Date, "now")
        .mockReturnValue(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const result = mod.loadAssignmentCache("link-1");
      spy.mockRestore();
      expect(result).toBeNull();
      expect(localStorage.getItem("mm-assignment-link-1")).toBeNull();
    });

    it("returns data when cache is within the 7-day TTL (6 days old)", () => {
      mod.saveAssignmentCache("link-1", { name: "Territory A" });
      const spy = vi
        .spyOn(Date, "now")
        .mockReturnValue(Date.now() + 6 * 24 * 60 * 60 * 1000);
      const result = mod.loadAssignmentCache<{ name: string }>("link-1");
      spy.mockRestore();
      expect(result).toEqual({ name: "Territory A" });
    });

    it("evicts legacy entries (no cachedAt) as expired", () => {
      // Simulate a pre-fix entry stored as raw data without the wrapper
      localStorage.setItem(
        "mm-assignment-link-1",
        JSON.stringify({ name: "Legacy" })
      );
      // No cachedAt field → treated as cachedAt=0 → always expired
      expect(mod.loadAssignmentCache("link-1")).toBeNull();
      expect(localStorage.getItem("mm-assignment-link-1")).toBeNull();
    });
  });

  // ── consumeUpgradeLostOpsWarning ──────────────────────────────────────────────

  describe("consumeUpgradeLostOpsWarning", () => {
    it("returns the stored count and clears it on first call", () => {
      localStorage.setItem("mm-upgrade-lost-ops", "5");
      expect(mod.consumeUpgradeLostOpsWarning()).toBe(5);
    });

    it("returns 0 on second call (one-shot)", () => {
      localStorage.setItem("mm-upgrade-lost-ops", "5");
      mod.consumeUpgradeLostOpsWarning();
      expect(mod.consumeUpgradeLostOpsWarning()).toBe(0);
    });

    it("returns 0 when no warning is stored", () => {
      expect(mod.consumeUpgradeLostOpsWarning()).toBe(0);
    });
  });

  // ── schema upgrade (v2 → v3) ──────────────────────────────────────────────────

  describe("schema upgrade v2 → v3", () => {
    // Seed a v2-style DB (autoincrement key, old field names) with `count` ops.
    const seedV2DB = (count: number): Promise<void> =>
      new Promise((resolve, reject) => {
        const req = globalThis.indexedDB.open("ministry-mapper-smartsync", 2);
        req.onupgradeneeded = () => {
          const store = req.result.createObjectStore("pending-ops", {
            autoIncrement: true
          });
          store.createIndex("by_assignment", "assignmentId");
        };
        req.onsuccess = () => {
          const db = req.result;
          if (count === 0) {
            db.close();
            resolve();
            return;
          }
          const tx = db.transaction("pending-ops", "readwrite");
          for (let i = 0; i < count; i++) {
            tx.objectStore("pending-ops").add({
              assignmentId: "map-1",
              addressId: `addr-${i}`
            });
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });

    // These tests need their own beforeEach: fresh IDB + reset modules WITHOUT
    // pre-importing the module, so the module opens the DB for the first time
    // during the test and triggers the upgrade.
    beforeEach(() => {
      globalThis.indexedDB = new IDBFactory();
      vi.resetModules();
      localStorage.clear();
    });

    it("stores lost op count in localStorage when ops existed before v3 upgrade", async () => {
      await seedV2DB(3);
      const freshMod = await import("./smartsync");
      await freshMod.getQueue("map-1"); // forces DB open → triggers upgrade
      expect(localStorage.getItem("mm-upgrade-lost-ops")).toBe("3");
    });

    it("does not set localStorage when queue was empty before upgrade", async () => {
      await seedV2DB(0);
      const freshMod = await import("./smartsync");
      await freshMod.getQueue("map-1");
      expect(localStorage.getItem("mm-upgrade-lost-ops")).toBeNull();
    });

    it("does not set localStorage on fresh install (oldVersion = 0)", async () => {
      // No seed — DB doesn't exist yet; upgrade runs with oldVersion=0.
      const freshMod = await import("./smartsync");
      await freshMod.getQueue("map-1");
      expect(localStorage.getItem("mm-upgrade-lost-ops")).toBeNull();
    });

    it("v3 DB is fully operational after upgrade", async () => {
      await seedV2DB(2);
      const freshMod = await import("./smartsync");
      // Should be able to enqueue and retrieve ops normally after upgrade.
      await freshMod.enqueueOp(makeOp());
      const ops = await freshMod.getQueue("map-1");
      expect(ops).toHaveLength(1);
    });
  });

  // ── applyOpTypes ──────────────────────────────────────────────────────────────

  describe("applyOpTypes", () => {
    const optionMap = new Map([
      ["opt-a", "A"],
      ["opt-b", "B"]
    ]);

    it("returns the newTypes array directly when provided (no reconstruction)", () => {
      const newTypes = [{ id: "opt-a", code: "A", aoId: "ao-1" }];
      const result = mod.applyOpTypes(
        { desiredOptionIds: ["opt-a"], newTypes },
        optionMap
      );
      expect(result).toBe(newTypes); // same reference
    });

    it("reconstructs types from desiredOptionIds using optionCodeMap", () => {
      const result = mod.applyOpTypes(
        { desiredOptionIds: ["opt-a", "opt-b"] },
        optionMap
      );
      expect(result).toEqual([
        { id: "opt-a", code: "A", aoId: undefined },
        { id: "opt-b", code: "B", aoId: undefined }
      ]);
    });

    it("uses empty string for unknown option IDs", () => {
      const result = mod.applyOpTypes(
        { desiredOptionIds: ["opt-unknown"] },
        optionMap
      );
      expect(result[0].code).toBe("");
    });

    it("returns empty array when desiredOptionIds is empty and no newTypes", () => {
      const result = mod.applyOpTypes({ desiredOptionIds: [] }, optionMap);
      expect(result).toEqual([]);
    });

    it("preserves order of desiredOptionIds in reconstructed output", () => {
      const result = mod.applyOpTypes(
        { desiredOptionIds: ["opt-b", "opt-a"] },
        optionMap
      );
      expect(result.map((t) => t.id)).toEqual(["opt-b", "opt-a"]);
    });
  });
});
