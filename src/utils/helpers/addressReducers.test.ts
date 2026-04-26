import { describe, it, expect } from "vitest";
import { RecordModel } from "pocketbase";
import {
  applyAddressEvent,
  applyAddressOptionsEvent,
  createUnitDetails,
  RealtimeEvent
} from "./addressReducers";
import { unitDetails, HHOptionProps } from "../interface";
import { STATUS_CODES } from "../constants";

const makeAddressRecord = (overrides: Partial<RecordModel> = {}): RecordModel =>
  ({
    id: "addr-1",
    code: "10",
    notes: "",
    status: STATUS_CODES.DEFAULT,
    not_home_tries: 0,
    dnc_time: "",
    coordinates: undefined,
    sequence: 1,
    floor: 1,
    updated: "",
    updated_by: "",
    collectionId: "addresses",
    collectionName: "addresses",
    created: "",
    ...overrides
  }) as RecordModel;

const makeUnit = (overrides: Partial<unitDetails> = {}): unitDetails => ({
  id: "addr-1",
  number: "10",
  note: "",
  type: [],
  status: STATUS_CODES.DEFAULT,
  nhcount: "0",
  dnctime: 0,
  sequence: 1,
  floor: 1,
  ...overrides
});

const makeOptionsRecord = (overrides: Partial<RecordModel> = {}): RecordModel =>
  ({
    id: "ao-1",
    address: "addr-1",
    option: "opt-default",
    collectionId: "address_options",
    collectionName: "address_options",
    created: "",
    updated: "",
    ...overrides
  }) as RecordModel;

const buildMap = (units: unitDetails[]): Map<string, unitDetails> =>
  new Map(units.map((u) => [u.id, u]));

const optionsRegistry: ReadonlyMap<string, HHOptionProps> = new Map([
  [
    "opt-default",
    {
      id: "opt-default",
      code: "DF",
      description: "Default",
      isCountable: false,
      sequence: 1
    }
  ],
  [
    "opt-bilingual",
    {
      id: "opt-bilingual",
      code: "BL",
      description: "Bilingual",
      isCountable: false,
      sequence: 2
    }
  ]
]);

describe("createUnitDetails", () => {
  it("maps a PocketBase address record to unitDetails", () => {
    const record = makeAddressRecord({
      id: "addr-x",
      code: "42",
      notes: "knock soft",
      status: "done",
      not_home_tries: 2,
      dnc_time: "2026-01-01T00:00:00Z",
      sequence: 3,
      floor: 2,
      updated: "2026-01-02T00:00:00Z",
      updated_by: "user-7"
    });
    const result = createUnitDetails(record);
    expect(result).toEqual({
      id: "addr-x",
      coordinates: undefined,
      number: "42",
      note: "knock soft",
      type: [],
      status: "done",
      nhcount: "2",
      dnctime: Date.parse("2026-01-01T00:00:00Z"),
      sequence: 3,
      floor: 2,
      updated: Date.parse("2026-01-02T00:00:00Z"),
      updatedBy: "user-7"
    });
  });
});

describe("applyAddressEvent — reset burst regression", () => {
  // This is the headline test: simulate the exact scenario that was broken.
  // 50 sequential UPDATE events targeting different addresses, all flipping
  // status to "not_done". The reducer must compose them so all 50 changes
  // appear in the final map. The bug we fixed lost all but the last event.
  it("composes 50 sequential update events without losing any", () => {
    let map = buildMap(
      Array.from({ length: 50 }, (_, i) =>
        makeUnit({ id: `addr-${i}`, status: "done" })
      )
    );

    for (let i = 0; i < 50; i++) {
      const event: RealtimeEvent = {
        action: "update",
        record: makeAddressRecord({
          id: `addr-${i}`,
          status: "not_done"
        })
      };
      map = applyAddressEvent(map, event, new Set());
    }

    expect(map.size).toBe(50);
    for (let i = 0; i < 50; i++) {
      expect(map.get(`addr-${i}`)?.status).toBe("not_done");
    }
  });
});

describe("applyAddressEvent — update", () => {
  it("replaces a single address and leaves others untouched", () => {
    const prev = buildMap([
      makeUnit({ id: "addr-1", status: "done" }),
      makeUnit({ id: "addr-2", status: "done" })
    ]);
    const event: RealtimeEvent = {
      action: "update",
      record: makeAddressRecord({ id: "addr-1", status: "not_done" })
    };
    const next = applyAddressEvent(prev, event, new Set());
    expect(next.get("addr-1")?.status).toBe("not_done");
    expect(next.get("addr-2")?.status).toBe("done");
    expect(next).not.toBe(prev);
  });

  it("preserves existing type (badges) when applying an update", () => {
    const prev = buildMap([
      makeUnit({
        id: "addr-1",
        type: [{ id: "opt-default", code: "DF", aoId: "ao-1" }]
      })
    ]);
    const event: RealtimeEvent = {
      action: "update",
      record: makeAddressRecord({ id: "addr-1", status: "not_done" })
    };
    const next = applyAddressEvent(prev, event, new Set());
    expect(next.get("addr-1")?.type).toEqual([
      { id: "opt-default", code: "DF", aoId: "ao-1" }
    ]);
    expect(next.get("addr-1")?.status).toBe("not_done");
  });
});

describe("applyAddressEvent — create (new address)", () => {
  it("adds a brand new address to the map alongside existing ones", () => {
    const prev = buildMap([makeUnit({ id: "addr-1" })]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeAddressRecord({
        id: "addr-new",
        code: "99",
        status: "not_done",
        sequence: 5,
        floor: 2
      })
    };
    const next = applyAddressEvent(prev, event, new Set());
    expect(next.size).toBe(2);
    expect(next.get("addr-new")).toMatchObject({
      id: "addr-new",
      number: "99",
      status: "not_done",
      sequence: 5,
      floor: 2,
      type: []
    });
    expect(next.get("addr-1")).toBeDefined();
  });

  it("preserves type for own optimistic create (pending guard)", () => {
    // Flow: user creates address → addAddressOptimistically writes it to
    // state with chosen badges → server processes → realtime CREATE echoes
    // back without expand data. Pending guard must prevent the echo from
    // wiping the optimistic badges before the op flushes.
    const prev = buildMap([
      makeUnit({
        id: "addr-new",
        status: "optimistic",
        type: [{ id: "opt-default", code: "DF" }]
      })
    ]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeAddressRecord({ id: "addr-new", status: "not_done" })
    };
    const next = applyAddressEvent(prev, event, new Set(["addr-new"]));
    expect(next).toBe(prev);
    expect(next.get("addr-new")?.status).toBe("optimistic");
    expect(next.get("addr-new")?.type).toEqual([
      { id: "opt-default", code: "DF" }
    ]);
  });

  it("composes a burst of new-address creates without losing any", () => {
    // E.g. another user bulk-imports addresses while this user is viewing
    // the map. Same race profile as the reset bug, but for inserts.
    let map = buildMap([]);
    for (let i = 0; i < 20; i++) {
      const event: RealtimeEvent = {
        action: "create",
        record: makeAddressRecord({
          id: `addr-new-${i}`,
          code: String(100 + i)
        })
      };
      map = applyAddressEvent(map, event, new Set());
    }
    expect(map.size).toBe(20);
    for (let i = 0; i < 20; i++) {
      expect(map.get(`addr-new-${i}`)?.number).toBe(String(100 + i));
    }
  });

  it("preserves existing badges if create arrives for a known address", () => {
    // Edge case: server CREATE event arrives after a refetch already
    // populated the address (with badges from the expand). The late event
    // must not wipe the badges, since address events carry no expand data.
    const prev = buildMap([
      makeUnit({
        id: "addr-1",
        type: [{ id: "opt-default", code: "DF", aoId: "ao-1" }]
      })
    ]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeAddressRecord({ id: "addr-1", status: "not_done" })
    };
    const next = applyAddressEvent(prev, event, new Set());
    expect(next.get("addr-1")?.type).toEqual([
      { id: "opt-default", code: "DF", aoId: "ao-1" }
    ]);
    expect(next.get("addr-1")?.status).toBe("not_done");
  });
});

describe("applyAddressEvent — delete", () => {
  it("removes an existing address", () => {
    const prev = buildMap([makeUnit({ id: "addr-1" })]);
    const event: RealtimeEvent = {
      action: "delete",
      record: makeAddressRecord({ id: "addr-1" })
    };
    const next = applyAddressEvent(prev, event, new Set());
    expect(next.has("addr-1")).toBe(false);
  });

  it("returns same reference for delete on unknown address", () => {
    const prev = buildMap([makeUnit({ id: "addr-1" })]);
    const event: RealtimeEvent = {
      action: "delete",
      record: makeAddressRecord({ id: "addr-missing" })
    };
    const next = applyAddressEvent(prev, event, new Set());
    expect(next).toBe(prev);
  });

  it("removes all addresses when a map-delete cascade fires N delete events", () => {
    // When a map is deleted, PocketBase cascades into addresses and emits a
    // delete realtime event per address. Same race profile as reset — without
    // a functional updater, only the last delete would land in state and the
    // user would see stale rows after the map was gone.
    let map = buildMap(
      Array.from({ length: 50 }, (_, i) => makeUnit({ id: `addr-${i}` }))
    );

    for (let i = 0; i < 50; i++) {
      map = applyAddressEvent(
        map,
        {
          action: "delete",
          record: makeAddressRecord({ id: `addr-${i}` })
        },
        new Set()
      );
    }

    expect(map.size).toBe(0);
  });

  it("composes a mixed burst of deletes and updates correctly", () => {
    // E.g. a partial cascade: some addresses deleted, others updated by a
    // concurrent action. All events must land regardless of order.
    let map = buildMap(
      Array.from({ length: 10 }, (_, i) =>
        makeUnit({ id: `addr-${i}`, status: "done" })
      )
    );

    for (let i = 0; i < 10; i++) {
      const event: RealtimeEvent =
        i % 2 === 0
          ? {
              action: "delete",
              record: makeAddressRecord({ id: `addr-${i}` })
            }
          : {
              action: "update",
              record: makeAddressRecord({
                id: `addr-${i}`,
                status: "not_done"
              })
            };
      map = applyAddressEvent(map, event, new Set());
    }

    expect(map.size).toBe(5);
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        expect(map.has(`addr-${i}`)).toBe(false);
      } else {
        expect(map.get(`addr-${i}`)?.status).toBe("not_done");
      }
    }
  });

  it("delete wins over a pending optimistic create", () => {
    // User creates address optimistically (in state + smartsync queue). Admin
    // deletes the map before the create flushes. Delete event must still
    // apply — the address no longer exists on the server. The stranded create
    // op in the queue is smart sync's problem, not the reducer's.
    const prev = buildMap([makeUnit({ id: "addr-new", status: "optimistic" })]);
    const event: RealtimeEvent = {
      action: "delete",
      record: makeAddressRecord({ id: "addr-new" })
    };
    const next = applyAddressEvent(prev, event, new Set(["addr-new"]));
    expect(next.has("addr-new")).toBe(false);
  });
});

describe("applyAddressEvent — pending guard", () => {
  it("returns same reference when address has a pending local write", () => {
    const prev = buildMap([makeUnit({ id: "addr-1", status: "optimistic" })]);
    const event: RealtimeEvent = {
      action: "update",
      record: makeAddressRecord({ id: "addr-1", status: "not_done" })
    };
    const next = applyAddressEvent(prev, event, new Set(["addr-1"]));
    expect(next).toBe(prev);
    expect(next.get("addr-1")?.status).toBe("optimistic");
  });

  it("still applies delete even when the address is pending", () => {
    // A server-side delete must always win — the address no longer exists.
    const prev = buildMap([makeUnit({ id: "addr-1" })]);
    const event: RealtimeEvent = {
      action: "delete",
      record: makeAddressRecord({ id: "addr-1" })
    };
    const next = applyAddressEvent(prev, event, new Set(["addr-1"]));
    expect(next.has("addr-1")).toBe(false);
  });
});

describe("applyAddressOptionsEvent — create", () => {
  it("appends a new badge to the address", () => {
    const prev = buildMap([makeUnit({ id: "addr-1", type: [] })]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeOptionsRecord({
        id: "ao-1",
        address: "addr-1",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next.get("addr-1")?.type).toEqual([
      { id: "opt-default", code: "DF", aoId: "ao-1" }
    ]);
  });

  it("returns same reference when badge already present (idempotent)", () => {
    const prev = buildMap([
      makeUnit({
        id: "addr-1",
        type: [{ id: "opt-default", code: "DF", aoId: "ao-1" }]
      })
    ]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeOptionsRecord({
        id: "ao-2",
        address: "addr-1",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next).toBe(prev);
  });

  it("uses empty code when option is unknown to the registry", () => {
    const prev = buildMap([makeUnit({ id: "addr-1", type: [] })]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeOptionsRecord({
        id: "ao-9",
        address: "addr-1",
        option: "opt-unknown"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next.get("addr-1")?.type).toEqual([
      { id: "opt-unknown", code: "", aoId: "ao-9" }
    ]);
  });
});

describe("applyAddressOptionsEvent — delete", () => {
  it("removes the badge", () => {
    const prev = buildMap([
      makeUnit({
        id: "addr-1",
        type: [
          { id: "opt-default", code: "DF", aoId: "ao-1" },
          { id: "opt-bilingual", code: "BL", aoId: "ao-2" }
        ]
      })
    ]);
    const event: RealtimeEvent = {
      action: "delete",
      record: makeOptionsRecord({
        id: "ao-1",
        address: "addr-1",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next.get("addr-1")?.type).toEqual([
      { id: "opt-bilingual", code: "BL", aoId: "ao-2" }
    ]);
  });

  it("returns same reference when badge is not present", () => {
    const prev = buildMap([makeUnit({ id: "addr-1", type: [] })]);
    const event: RealtimeEvent = {
      action: "delete",
      record: makeOptionsRecord({
        id: "ao-1",
        address: "addr-1",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next).toBe(prev);
  });
});

describe("applyAddressOptionsEvent — guards", () => {
  it("returns same reference for unknown address", () => {
    const prev = buildMap([makeUnit({ id: "addr-1" })]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeOptionsRecord({
        id: "ao-1",
        address: "addr-missing",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next).toBe(prev);
  });

  it("returns same reference when address is pending", () => {
    const prev = buildMap([makeUnit({ id: "addr-1", type: [] })]);
    const event: RealtimeEvent = {
      action: "create",
      record: makeOptionsRecord({
        id: "ao-1",
        address: "addr-1",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(["addr-1"]),
      optionsRegistry
    );
    expect(next).toBe(prev);
  });

  it("returns same reference for unsupported actions (e.g. update)", () => {
    const prev = buildMap([makeUnit({ id: "addr-1" })]);
    const event: RealtimeEvent = {
      action: "update",
      record: makeOptionsRecord({
        id: "ao-1",
        address: "addr-1",
        option: "opt-default"
      })
    };
    const next = applyAddressOptionsEvent(
      prev,
      event,
      new Set(),
      optionsRegistry
    );
    expect(next).toBe(prev);
  });
});
