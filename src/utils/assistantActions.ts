import type {
  AssistantProposal,
  ProposalItem,
  ProposalState,
  SharedLocation
} from "../hooks/useAssistant";
import { ANALYTICS_EVENTS, trackEvent } from "./analytics";
import { batchUpdateAddress, fetchAddressOptionMap } from "./addressUpdate";
import addHours from "./helpers/addhours";
import { isValidCoordinate } from "./helpers/maphelpers";
import {
  callFunction,
  createData,
  deleteDataById,
  getFirstItemOfList,
  getList,
  getUser,
  pb,
  updateDataById
} from "./pocketbase";

// Changes the assistant prepared, run with the admin's own session. Each
// makes the same call its admin screen makes, so the backend's checks apply,
// after re-reading the record: one that is gone, or changed since the
// proposal was prepared, stops the change.

type Outcome = Partial<ProposalState>;
type Kind = AssistantProposal["kind"];

interface Context {
  proposal: AssistantProposal;
  congregation: string;
  // Where the admin stands, for the actions that need it.
  location?: SharedLocation;
  // Where each new map goes, set on the card.
  locations?: Record<string, SharedLocation>;
  key: (step: string) => string;
}

// A map to create, as the backend planned it (proposals_create.go).
export interface MapPlan {
  name: string;
  type: "single" | "multi";
  lowest_floor: number;
  top_floor: number;
  floors: number;
  homes: number;
  units: string[];
  address: string;
}

export const mapPlans = (proposal: AssistantProposal): MapPlan[] =>
  Array.isArray(proposal.data?.maps) ? (proposal.data.maps as MapPlan[]) : [];

export const listOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

// Proposal fields that carry JSON; unreadable text reads as empty.
const parseObject = (raw?: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(raw ?? "");
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

// Creates each planned map through /map/add, as the New Map form does, and
// carries on past one that fails so the rest are not lost.
const createMaps = async (
  { proposal, congregation, locations, key }: Context,
  territory: string
) => {
  const created: string[] = [];
  const failed: string[] = [];
  for (const [index, plan] of mapPlans(proposal).entries()) {
    const location = locations?.[String(index)];
    try {
      if (!location) throw new Error("no location");
      const map = await callFunction("/map/add", {
        method: "POST",
        requestKey: key(`map-add-${index}`),
        body: {
          name: plan.name,
          sequence: plan.units.join(","),
          type: plan.type,
          coordinates: JSON.stringify({ lat: location.lat, lng: location.lng }),
          congregation,
          territory,
          floors: plan.floors,
          start_floor: plan.lowest_floor
        }
      });
      created.push(String(map.id));
    } catch (error) {
      failed.push(
        `${plan.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return { created, failed };
};

// New maps can be taken back only while nobody has visited or noted a home.
const mapsUnused = async (maps: string[], requestKey: string) => {
  if (!maps.length) return true;
  const used = await getList("addresses", {
    filter: `(${maps.map((map) => `map="${map}"`).join(" || ")}) && (status!="not_done" || notes!="")`,
    fields: "id",
    requestKey
  });
  return !used.length;
};

// A home's fields a home update changes; see homeState in the backend.
interface HomeState {
  status: string;
  notes: string;
  not_home_tries: number;
  dnc_time: string;
  types: string[];
  type_names: string[];
}

export const parseHome = (raw?: string): HomeState => ({
  status: "",
  notes: "",
  not_home_tries: 0,
  dnc_time: "",
  types: [],
  type_names: [],
  ...parseObject(raw)
});

const STALE: Outcome = { status: "stale" };
const done = (extra: Outcome = {}): Outcome => ({
  status: "done",
  doneAt: Date.now(),
  ...extra
});

const fetchRecord = (
  collection: string,
  id: string,
  congregation: string,
  fields: string,
  requestKey: string
) =>
  getFirstItemOfList(
    collection,
    `id="${id}" && congregation="${congregation}"`,
    { fields, requestKey }
  );

// Stored points arrive as an object or as JSON text; compare them as text.
const pointKey = (value: unknown): string => {
  let point = value;
  if (typeof value === "string") {
    if (!value.trim()) return "";
    try {
      point = JSON.parse(value);
    } catch {
      return "";
    }
  }
  return isValidCoordinate(point) ? `${point.lat},${point.lng}` : "";
};

const sameTime = (a: string, b: string) =>
  (!a && !b) || (!!a && !!b && Date.parse(a) === Date.parse(b));

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

// Writes one home from `from` to `to`, if it still holds `from`.
const writeHome = async (
  { key }: Context,
  item: ProposalItem | undefined,
  from: HomeState,
  to: HomeState
): Promise<boolean> => {
  if (!item) return false;
  const [current, options] = await Promise.all([
    getFirstItemOfList("addresses", `id="${item.id}" && map="${item.map}"`, {
      fields: "id,status,notes,not_home_tries,dnc_time,coordinates",
      requestKey: key(`home-check-${item.id}`)
    }),
    fetchAddressOptionMap(item.id, item.map)
  ]);
  if (!current) return false;
  const unchanged =
    (current.status ?? "") === from.status &&
    (current.notes ?? "") === from.notes &&
    Number(current.not_home_tries ?? 0) === from.not_home_tries &&
    sameTime(current.dnc_time ?? "", from.dnc_time) &&
    sameSet([...options.keys()], from.types);
  if (!unchanged) return false;
  await batchUpdateAddress({
    addressId: item.id,
    mapId: item.map,
    updateData: {
      notes: to.notes,
      status: to.status,
      not_home_tries: to.not_home_tries,
      dnc_time: to.dnc_time,
      // Kept as it is: a home update never moves a home.
      coordinates: current.coordinates
        ? JSON.stringify(current.coordinates)
        : null
    },
    toDeleteAoIds: [...options.entries()]
      .filter(([option]) => !to.types.includes(option))
      .map(([, aoId]) => aoId),
    toAddOptionIds: to.types.filter((option) => !options.has(option))
  });
  return true;
};

// Sets a flag on the listed messages that do not have it yet, and returns
// the ones it changed.
const flagMessages = async (
  { proposal, key }: Context,
  filter: string,
  data: Record<string, boolean>
) => {
  const items = proposal.items ?? [];
  const changed: string[] = [];
  for (const map of new Set(items.map((item) => item.map))) {
    const pending = await getList("messages", {
      filter: `map="${map}" && ${filter}`,
      fields: "id",
      requestKey: key(`messages-${map}`)
    });
    const ids = new Set(pending.map((record) => record.id));
    for (const item of items) {
      if (item.map !== map || !ids.has(item.id)) continue;
      await updateDataById("messages", item.id, data, {
        requestKey: key(`message-${item.id}`)
      });
      changed.push(item.id);
    }
  }
  return changed;
};

// Each swap below changes one thing from `from` to `to` if it still holds
// `from`, and reports whether it did. Confirm and Undo run the same swap in
// opposite directions.

const swapName = async (
  { proposal, congregation, key }: Context,
  from: string,
  to: string
) => {
  const target = proposal.target;
  if (!target) return false;
  const collection = proposal.kind === "map_rename" ? "maps" : "territories";
  const record = await fetchRecord(
    collection,
    target.id,
    congregation,
    "id,description",
    key("check")
  );
  if (!record || (record.description ?? "") !== from) return false;
  await updateDataById(
    collection,
    target.id,
    { description: to },
    { requestKey: key("rename") }
  );
  return true;
};

const swapLocation = async (
  { proposal, congregation, key }: Context,
  from: unknown,
  to: string | null
) => {
  const target = proposal.target;
  if (!target) return false;
  const map = await fetchRecord(
    "maps",
    target.id,
    congregation,
    "id,coordinates",
    key("check")
  );
  if (!map || pointKey(map.coordinates) !== pointKey(from)) return false;
  await updateDataById(
    "maps",
    target.id,
    { coordinates: to },
    { requestKey: key("location") }
  );
  return true;
};

// A type, not an interface, so it passes as a record to updateDataById.
export type CongregationSettings = {
  max_tries: number;
  expiry_hours: number;
  completion_threshold: number;
};

const toSettings = (record: Record<string, unknown>): CongregationSettings => ({
  max_tries: Number(record.max_tries ?? 0),
  expiry_hours: Number(record.expiry_hours ?? 0),
  completion_threshold: Number(record.completion_threshold ?? 0)
});

export const parseSettings = (raw?: string) => toSettings(parseObject(raw));

const swapSettings = async (
  { congregation, key }: Context,
  from?: string,
  to?: string
) => {
  const record = await pb.collection("congregations").getOne(congregation, {
    fields: "id,max_tries,expiry_hours,completion_threshold",
    requestKey: key("settings-check")
  });
  const current = toSettings(record);
  const expected = parseSettings(from);
  const fields = Object.keys(current) as Array<keyof CongregationSettings>;
  if (fields.some((field) => current[field] !== expected[field])) return false;
  await updateDataById("congregations", congregation, parseSettings(to), {
    requestKey: key("settings")
  });
  return true;
};

const swapTerritory = async (
  { proposal, congregation, key }: Context,
  from: string,
  to: string
) => {
  const target = proposal.target;
  if (!target) return false;
  const map = await fetchRecord(
    "maps",
    target.id,
    congregation,
    "id,territory",
    key("check")
  );
  if (!map || map.territory !== from) return false;
  await callFunction("/map/territory/update", {
    method: "POST",
    requestKey: key("move"),
    body: { map: target.id, new_territory: to, old_territory: from }
  });
  return true;
};

const mapExists = ({ congregation, key }: Context, mapId: string) =>
  fetchRecord("maps", mapId, congregation, "id", key("check"));

// Applies the proposal's change to each listed home that still holds what it
// held when prepared; homes changed since are left and counted.
const updateHomes = async (ctx: Context, undo?: ProposalState) => {
  const patch = parseObject(ctx.proposal.value) as Partial<HomeState>;
  const ids = undo ? new Set(undo.recordIds) : undefined;
  const changed: string[] = [];
  let skipped = 0;
  for (const item of ctx.proposal.items ?? []) {
    if (ids && !ids.has(item.id)) continue;
    const before = parseHome(item.detail);
    const after = { ...before, ...patch };
    const [from, to] = undo ? [after, before] : [before, after];
    if (await writeHome(ctx, item, from, to)) changed.push(item.id);
    else skipped++;
  }
  if (undo) return { status: "undone", skipped } as Outcome;
  return changed.length ? done({ recordIds: changed, skipped }) : STALE;
};

const rename = async (ctx: Context) =>
  (await swapName(ctx, ctx.proposal.previous ?? "", ctx.proposal.value ?? ""))
    ? done()
    : STALE;

const RUN: Partial<Record<Kind, (ctx: Context) => Promise<Outcome>>> = {
  report_email: async ({ congregation }) => {
    await callFunction("/report/generate", {
      method: "POST",
      requestKey: `report-generate-${congregation}`,
      body: { congregation }
    });
    trackEvent(ANALYTICS_EVENTS.REPORT_GENERATED);
    return done();
  },

  map_rename: rename,
  territory_rename: rename,

  share_link: async (ctx) => {
    const { proposal, congregation, key } = ctx;
    const target = proposal.target;
    if (!target || !(await mapExists(ctx, target.id))) return STALE;
    const link = await createData(
      "assignments",
      {
        map: target.id,
        user: getUser("id"),
        type: proposal.linkType,
        expiry_date: addHours(proposal.hours ?? 0),
        publisher: proposal.value,
        congregation
      },
      { requestKey: key("link") }
    );
    return done({ recordId: link.id });
  },

  pin_message: async (ctx) => {
    const { proposal, congregation, key } = ctx;
    const target = proposal.target;
    if (!target || !(await mapExists(ctx, target.id))) return STALE;
    const message = await createData(
      "messages",
      {
        map: target.id,
        message: proposal.value,
        read: true,
        pinned: true,
        created_by: getUser("name"),
        type: "administrator",
        congregation
      },
      { requestKey: key("message") }
    );
    trackEvent(ANALYTICS_EVENTS.MESSAGE_SENT, { role: "administrator" });
    return done({ recordId: message.id });
  },

  mark_read: async (ctx) => {
    const changed = await flagMessages(
      ctx,
      `read=false && type!="administrator"`,
      { read: true }
    );
    return changed.length ? done({ recordIds: changed }) : STALE;
  },

  unpin_message: async (ctx) => {
    const changed = await flagMessages(
      ctx,
      `pinned=true && type="administrator"`,
      { pinned: false }
    );
    if (!changed.length) return STALE;
    trackEvent(ANALYTICS_EVENTS.MESSAGE_PINNED, { pinned: false });
    return done({ recordIds: changed });
  },

  map_location: async (ctx) => {
    const { location } = ctx;
    if (!location) return STALE;
    const applied = JSON.stringify({ lat: location.lat, lng: location.lng });
    if (!(await swapLocation(ctx, ctx.proposal.previous, applied)))
      return STALE;
    trackEvent(ANALYTICS_EVENTS.ADDRESS_GEOLOCATION_UPDATED);
    return done({ applied });
  },

  link_revoke: async ({ proposal, key }) => {
    const removed: string[] = [];
    for (const item of proposal.items ?? []) {
      const deleted = await deleteDataById("assignments", item.id, {
        requestKey: key(`revoke-${item.id}`)
      });
      if (deleted) removed.push(item.id);
    }
    return removed.length ? done({ recordIds: removed }) : STALE;
  },

  quick_link: async ({ proposal, location, key }) => {
    const target = proposal.target;
    if (!target || !location) return STALE;
    const link = await callFunction("/territory/link", {
      method: "POST",
      requestKey: key("quick-link"),
      body: {
        territory: target.id,
        publisher: proposal.value,
        coordinates: { lat: location.lat, lng: location.lng }
      }
    });
    trackEvent(ANALYTICS_EVENTS.QUICK_LINK_GENERATED);
    return done({ recordId: link.linkId, label: link.mapName });
  },

  home_update: async (ctx) =>
    (await writeHome(
      ctx,
      ctx.proposal.items?.[0],
      parseHome(ctx.proposal.previous),
      parseHome(ctx.proposal.value)
    ))
      ? done()
      : STALE,

  map_reset: async (ctx) => {
    const target = ctx.proposal.target;
    if (!target || !(await mapExists(ctx, target.id))) return STALE;
    await callFunction("/map/reset", {
      method: "POST",
      requestKey: ctx.key("map-reset"),
      body: { map: target.id }
    });
    return done();
  },

  territory_reset: async ({ proposal, key }) => {
    const target = proposal.target;
    if (!target) return STALE;
    await callFunction("/territory/reset", {
      method: "POST",
      requestKey: key("territory-reset"),
      body: { territory: target.id }
    });
    return done();
  },

  tries_reset: updateHomes,
  homes_status: updateHomes,
  dnc_return: updateHomes,

  settings: async (ctx) =>
    (await swapSettings(ctx, ctx.proposal.previous, ctx.proposal.value))
      ? done()
      : STALE,

  map_move: async (ctx) =>
    (await swapTerritory(
      ctx,
      String(ctx.proposal.previous),
      String(ctx.proposal.value)
    ))
      ? done()
      : STALE,

  floor_add: async (ctx) => {
    const target = ctx.proposal.target;
    const floor = Number(ctx.proposal.data?.floor);
    if (!target || !Number.isFinite(floor)) return STALE;
    // The floor must not exist yet: if it does, the map changed since.
    if (
      (await homesOn(target.id, `floor=${floor}`, ctx.key("floor-check")))
        .length
    )
      return STALE;
    await callFunction("/map/floor/add", {
      method: "POST",
      requestKey: ctx.key("floor-add"),
      body: { map: target.id, add_higher: ctx.proposal.to === "top" }
    });
    return done();
  },

  territory_create: async (ctx) => {
    const { proposal, congregation, key } = ctx;
    const code = proposal.target?.name ?? "";
    const taken = await getFirstItemOfList(
      "territories",
      `code="${code}" && congregation="${congregation}"`,
      { fields: "id", requestKey: key("code-check") }
    );
    if (!code || taken) return STALE;
    const territory = await createData(
      "territories",
      { code, description: proposal.value, congregation },
      { requestKey: key("territory") }
    );
    trackEvent(ANALYTICS_EVENTS.TERRITORY_CREATED);
    const { created, failed } = await createMaps(ctx, territory.id);
    return done({
      recordId: territory.id,
      recordIds: created,
      error: failed.length ? failed.join("; ") : undefined
    });
  },

  maps_create: async (ctx) => {
    const target = ctx.proposal.target;
    if (
      !target ||
      !(await fetchRecord(
        "territories",
        target.id,
        ctx.congregation,
        "id",
        ctx.key("check")
      ))
    )
      return STALE;
    const { created, failed } = await createMaps(ctx, target.id);
    if (!created.length) return { status: "failed", error: failed.join("; ") };
    return done({
      recordIds: created,
      error: failed.length ? failed.join("; ") : undefined
    });
  },

  unit_add: async (ctx) => {
    const target = ctx.proposal.target;
    const units = unitsOf(ctx.proposal);
    if (!target || !units.length) return STALE;
    await callFunction("/map/code/add", {
      method: "POST",
      requestKey: ctx.key("unit-add"),
      body: { map: target.id, codes: units }
    });
    return done();
  }
};

// The homes on a map matching a filter, with what Undo checks.
const homesOn = (map: string, filter: string, requestKey: string) =>
  getList("addresses", {
    filter: `map="${map}" && ${filter}`,
    fields: "id,status,notes",
    requestKey
  });

// New homes nobody has visited or noted yet; only those are safe to remove.
const untouched = (homes: Array<Record<string, unknown>>) =>
  homes.every((home) => home.status === "not_done" && !home.notes);

const unitsOf = (proposal: AssistantProposal) => listOf(proposal.data?.units);

export const runRecordProposal = async (
  proposal: AssistantProposal,
  congregation: string,
  location?: SharedLocation,
  locations?: Record<string, SharedLocation>
): Promise<Outcome> => {
  const run = RUN[proposal.kind];
  if (!run) return STALE;
  return run({
    proposal,
    congregation,
    location,
    locations,
    key: (step) => `assistant-${step}-${proposal.id}`
  });
};

// Takes a change back. A rename, location or home is restored only if no one
// has changed it again since; otherwise `changedSince` says why it was left.
export const undoRecordProposal = async (
  proposal: AssistantProposal,
  state: ProposalState,
  congregation: string,
  changedSince: string
): Promise<Outcome> => {
  const ctx: Context = {
    proposal,
    congregation,
    key: (step) => `assistant-undo-${step}-${proposal.id}`
  };
  const target = proposal.target;
  const leftAsItIs: Outcome = { status: "done", error: changedSince };
  const undone = (swapped: boolean): Outcome =>
    swapped ? { status: "undone" } : leftAsItIs;
  switch (proposal.kind) {
    case "map_rename":
    case "territory_rename":
      return undone(
        await swapName(ctx, proposal.value ?? "", proposal.previous ?? "")
      );
    case "map_location":
      return undone(
        await swapLocation(ctx, state.applied, proposal.previous || null)
      );
    case "tries_reset":
    case "homes_status":
    case "dnc_return":
      return updateHomes(ctx, state);
    case "settings":
      return undone(await swapSettings(ctx, proposal.value, proposal.previous));
    case "map_move":
      return undone(
        await swapTerritory(
          ctx,
          String(proposal.value),
          String(proposal.previous)
        )
      );
    case "floor_add": {
      const floor = Number(proposal.data?.floor);
      if (!target || !Number.isFinite(floor)) return { status: "done" };
      const homes = await homesOn(
        target.id,
        `floor=${floor}`,
        ctx.key("floor-check")
      );
      if (!homes.length || !untouched(homes)) return leftAsItIs;
      await callFunction("/map/floor/remove", {
        method: "POST",
        requestKey: ctx.key("floor-remove"),
        body: { map: target.id, floor }
      });
      return { status: "undone" };
    }
    case "unit_add": {
      const units = unitsOf(proposal);
      if (!target || !units.length) return { status: "done" };
      const homes = await homesOn(
        target.id,
        `(${units.map((code) => `code="${code}"`).join(" || ")})`,
        ctx.key("unit-check")
      );
      if (!untouched(homes)) return leftAsItIs;
      for (const code of units) {
        await callFunction("/map/code/delete", {
          method: "POST",
          requestKey: ctx.key(`unit-delete-${code}`),
          body: { map: target.id, code }
        });
      }
      return { status: "undone" };
    }
    case "territory_create":
    case "maps_create": {
      const maps = state.recordIds ?? [];
      if (!(await mapsUnused(maps, ctx.key("used")))) return leftAsItIs;
      if (proposal.kind === "territory_create" && state.recordId) {
        // Deletes the territory with every map and home in it.
        await callFunction("/territory/delete", {
          method: "POST",
          requestKey: ctx.key("territory-delete"),
          body: { territory: state.recordId }
        });
      } else {
        for (const map of maps) {
          await deleteDataById("maps", map, {
            requestKey: ctx.key(`map-delete-${map}`)
          });
        }
      }
      return { status: "undone" };
    }
    case "home_update":
      return undone(
        await writeHome(
          ctx,
          proposal.items?.[0],
          parseHome(proposal.value),
          parseHome(proposal.previous)
        )
      );
    case "mark_read":
    case "unpin_message":
      for (const id of state.recordIds ?? []) {
        await updateDataById(
          "messages",
          id,
          proposal.kind === "mark_read" ? { read: false } : { pinned: true },
          { requestKey: ctx.key(`message-${id}`) }
        );
      }
      return { status: "undone" };
    case "share_link":
    case "pin_message":
    case "quick_link":
      if (state.recordId) {
        await deleteDataById(
          proposal.kind === "pin_message" ? "messages" : "assignments",
          state.recordId,
          { requestKey: ctx.key("delete") }
        );
      }
      return { status: "undone" };
    default:
      return { status: "done" };
  }
};
