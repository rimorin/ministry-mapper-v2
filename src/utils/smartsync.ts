import { openDB, type IDBPDatabase } from "idb";
import type { QueuedOp, typeInterface, unitDetails } from "./interface";

const DB_NAME = "ministry-mapper-smartsync";
const STORE_OPS = "pending-ops";
const STORE_CACHE = "address-cache";
const DB_VERSION = 3;
const ASSIGNMENT_KEY_PREFIX = "mm-assignment-";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type StoredOp = QueuedOp & {
  opKey: string;
  failCount?: number;
  // Set just before a server write begins. Survives a crash; resetAllInFlight()
  // clears it on the next startup so the op can be safely retried.
  inFlightAt?: number;
};

type SmartSyncDB = IDBPDatabase<{
  [STORE_OPS]: {
    key: string;
    value: StoredOp;
    indexes: { by_assignment: string };
  };
  [STORE_CACHE]: {
    key: string;
    value: { assignmentId: string; data: unknown; cachedAt: number };
  };
}>;

// Singleton: reuse the same IDB connection for the lifetime of the page.
let dbPromise: ReturnType<typeof openDB<SmartSyncDB>> | null = null;

const UPGRADE_LOST_OPS_KEY = "mm-upgrade-lost-ops";

/**
 * Call once on app startup. If a schema upgrade discarded queued ops (because
 * the op format changed incompatibly), the count is stored in localStorage so
 * the app can show a one-time warning and then clear it.
 */
export function consumeUpgradeLostOpsWarning(): number {
  const raw = localStorage.getItem(UPGRADE_LOST_OPS_KEY);
  if (!raw) return 0;
  localStorage.removeItem(UPGRADE_LOST_OPS_KEY);
  return parseInt(raw, 10) || 0;
}

function openSmartSyncDB(): ReturnType<typeof openDB<SmartSyncDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartSyncDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        // v1/v2 → v3: key changed from autoincrement int → deterministic string,
        // and QueuedOp schema changed (toAdd/toDelete → initialOptionIds/desiredOptionIds).
        // These formats are incompatible — ops must be dropped. Await the count
        // before deleteObjectStore so the result is guaranteed before the store
        // is removed (raw callback approach has a race on some IDB implementations).
        if (db.objectStoreNames.contains(STORE_OPS)) {
          if (oldVersion > 0 && oldVersion < 3) {
            try {
              const lost = await tx.objectStore(STORE_OPS).count();
              if (lost > 0) {
                try {
                  localStorage.setItem(UPGRADE_LOST_OPS_KEY, String(lost));
                } catch {
                  // localStorage unavailable (private browsing on some browsers)
                }
              }
            } catch {
              // Count failed — proceed with drop anyway; warning is best-effort.
            }
          }
          db.deleteObjectStore(STORE_OPS);
        }
        const store = db.createObjectStore(STORE_OPS, { keyPath: "opKey" });
        store.createIndex("by_assignment", "assignmentId");

        if (db.objectStoreNames.contains(STORE_CACHE)) {
          db.deleteObjectStore(STORE_CACHE);
        }
        db.createObjectStore(STORE_CACHE, { keyPath: "assignmentId" });
      },
      // Another tab is already open on an older version and is blocking our
      // upgrade. Notify the UI so it can prompt the publisher to close other tabs.
      blocked() {
        window.dispatchEvent(new CustomEvent("mm-idb-blocked"));
      },
      // We are blocking another tab's upgrade. Close our connection and reload
      // so the waiting tab can proceed.
      blocking() {
        dbPromise = null;
        window.location.reload();
      },
      terminated() {
        // Browser closed the connection (storage pressure). Reset so the next
        // call re-opens a fresh connection.
        dbPromise = null;
      }
    });
  }
  return dbPromise;
}

/**
 * Generates a 15-character lowercase alphanumeric ID matching PocketBase's
 * autogenerate pattern `[a-z0-9]{15}`.
 */
export function generateAddressId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % 36]).join("");
}

/**
 * Enqueue or replace a queued op for an address.
 * Uses a deterministic key (`assignmentId:addressId`) so `db.put` is an atomic
 * upsert — the latest save for each address always wins.
 *
 * When an op already exists for this address, `initialOptionIds` is preserved
 * from the FIRST queued op (the true server baseline). This prevents a second
 * offline edit from overwriting the original removal intent — e.g. if the user
 * changes A→B then B→C while offline, the flush correctly removes A (not B).
 */
export async function enqueueOp(op: QueuedOp): Promise<void> {
  const db = await openSmartSyncDB();
  const opKey = `${op.assignmentId}:${op.addressId}`;
  // Single readwrite transaction: the get + put are atomic, preventing a
  // concurrent tab from reading the same baseline between our read and write
  // and overwriting the preserved initialOptionIds.
  const tx = db.transaction(STORE_OPS, "readwrite");
  const existing = await tx.store.get(opKey);

  let storedOp: StoredOp;
  if (existing?.kind === "create") {
    // A later offline update to an address that was also created offline:
    // keep the create semantics (kind + createPayload) and merge in the new
    // field values so the single flush op represents the full intended state.
    storedOp = {
      ...op,
      opKey,
      kind: "create",
      createPayload: existing.createPayload,
      initialOptionIds: existing.initialOptionIds
    };
  } else if (existing) {
    // Update upsert — preserve initialOptionIds from the first queued op
    // (true server baseline) so offline chains don't lose removal intent.
    storedOp = { ...op, opKey, initialOptionIds: existing.initialOptionIds };
  } else {
    storedOp = { ...op, opKey };
  }
  await tx.store.put(storedOp);
  await tx.done;
}

export async function getQueue(assignmentId: string): Promise<StoredOp[]> {
  const db = await openSmartSyncDB();
  return db.getAllFromIndex(STORE_OPS, "by_assignment", assignmentId);
}

export async function getAllPendingOps(): Promise<StoredOp[]> {
  const db = await openSmartSyncDB();
  return db.getAll(STORE_OPS);
}

export async function removeFromQueue(opKey: string): Promise<void> {
  const db = await openSmartSyncDB();
  await db.delete(STORE_OPS, opKey);
}

/**
 * Returns the `ts` of a queued op, or undefined if the op no longer exists.
 * Used by flushQueue to detect mid-flush upserts: if the stored ts is newer
 * than the snapshot ts, the op was superseded and must not be deleted.
 */
export async function getOpTs(opKey: string): Promise<number | undefined> {
  const db = await openSmartSyncDB();
  const op = await db.get(STORE_OPS, opKey);
  return op?.ts;
}

async function mutateOp(
  opKey: string,
  mutate: (op: StoredOp) => StoredOp
): Promise<StoredOp | undefined> {
  const db = await openSmartSyncDB();
  const tx = db.transaction(STORE_OPS, "readwrite");
  const op = await tx.store.get(opKey);
  if (!op) {
    await tx.done;
    return undefined;
  }
  const updated = mutate(op);
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

/**
 * Increments the fail counter for a queued op and persists it.
 * Returns the updated fail count, or 0 if the op no longer exists.
 */
export async function incrementFailCount(opKey: string): Promise<number> {
  const updated = await mutateOp(opKey, (op) => ({
    ...op,
    failCount: (op.failCount ?? 0) + 1
  }));
  return updated?.failCount ?? 0;
}

// Returns the op's ts so flushQueue can compare it against getOpTs after the
// server write, without a second IDB read of the same record.
export async function markInFlight(opKey: string): Promise<number | undefined> {
  const updated = await mutateOp(opKey, (op) => ({
    ...op,
    inFlightAt: Date.now()
  }));
  return updated?.ts;
}

export async function clearInFlight(opKey: string): Promise<void> {
  await mutateOp(opKey, (op) => {
    const updated = { ...op };
    delete updated.inFlightAt;
    return updated;
  });
}

// On startup: any op still marked in-flight survived a crash mid-write.
// Reset so the op retries cleanly rather than being treated as a duplicate.
export async function resetAllInFlight(): Promise<void> {
  const db = await openSmartSyncDB();
  const tx = db.transaction(STORE_OPS, "readwrite");
  const ops = await tx.store.getAll();
  for (const op of ops) {
    if (op.inFlightAt !== undefined) {
      const updated = { ...op };
      delete updated.inFlightAt;
      await tx.store.put(updated);
    }
  }
  await tx.done;
}

export interface AddressCacheEntry {
  data: Record<string, unitDetails>;
  /** Unix ms timestamp of when the cache was last written from a server fetch. */
  cachedAt: number;
}

export async function saveAddressCache(
  assignmentId: string,
  data: Record<string, unitDetails>
): Promise<void> {
  try {
    const db = await openSmartSyncDB();
    await db.put(STORE_CACHE, { assignmentId, data, cachedAt: Date.now() });
  } catch {
    // Quota exceeded or IDB unavailable — fail silently
  }
}

export async function loadAddressCache(
  assignmentId: string
): Promise<AddressCacheEntry | null> {
  try {
    const db = await openSmartSyncDB();
    const entry = await db.get(STORE_CACHE, assignmentId);
    if (!entry) return null;
    const cachedAt = entry.cachedAt ?? 0;
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      void db.delete(STORE_CACHE, assignmentId);
      return null;
    }
    return { data: entry.data as Record<string, unitDetails>, cachedAt };
  } catch {
    return null;
  }
}

export function saveAssignmentCache(linkId: string, data: unknown): void {
  try {
    localStorage.setItem(
      ASSIGNMENT_KEY_PREFIX + linkId,
      JSON.stringify({ data, cachedAt: Date.now() })
    );
  } catch {
    // localStorage may be full or unavailable (private browsing)
  }
}

export function loadAssignmentCache<T>(linkId: string): T | null {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_KEY_PREFIX + linkId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { data: T; cachedAt?: number };
    if (Date.now() - (entry.cachedAt ?? 0) > CACHE_TTL_MS) {
      localStorage.removeItem(ASSIGNMENT_KEY_PREFIX + linkId);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Returns the rendered type array for a pending op.
 * Prefers `newTypes` (stored at enqueue time) for accuracy; falls back to
 * reconstructing from `desiredOptionIds` when newTypes is absent.
 */
export function applyOpTypes(
  op: Pick<QueuedOp, "desiredOptionIds" | "newTypes">,
  optionCodeMap: Map<string, string>
): typeInterface[] {
  if (op.newTypes) return op.newTypes;
  return op.desiredOptionIds.map((id) => ({
    id,
    code: optionCodeMap.get(id) ?? "",
    aoId: undefined
  }));
}
