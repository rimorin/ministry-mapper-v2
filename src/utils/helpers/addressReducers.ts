import { RecordModel } from "pocketbase";
import { unitDetails, HHOptionProps } from "../interface";
import { NOT_HOME_STATUS_CODES } from "../constants";

export type RealtimeEvent = {
  action: string;
  record: RecordModel;
};

/**
 * Map a PocketBase address record to the UI's unitDetails shape.
 * Type/badges are intentionally empty — they are populated separately
 * via the address_options subscription.
 */
export function createUnitDetails(record: RecordModel): unitDetails {
  return {
    id: record.id,
    coordinates: record.coordinates,
    number: record.code,
    note: record.notes,
    type: [],
    status: record.status,
    nhcount: String(record.not_home_tries ?? NOT_HOME_STATUS_CODES.DEFAULT),
    dnctime: record.dnc_time ? Date.parse(record.dnc_time) : 0,
    sequence: record.sequence,
    floor: record.floor,
    updated: record.updated ? Date.parse(record.updated) : undefined,
    updatedBy: record.updated_by
  };
}

/**
 * Pure reducer for the `addresses` realtime subscription.
 *
 * Returns `prev` (same reference) when the event is a no-op so React skips
 * re-rendering. The pending guard skips updates for addresses with in-flight
 * optimistic local writes, but always honours deletes (a deleted address
 * should disappear regardless of pending state).
 *
 * Existing `type` (badges) is preserved across updates because address
 * events do not carry expand data; badge changes arrive on the
 * address_options subscription.
 */
export function applyAddressEvent(
  prev: Map<string, unitDetails>,
  event: RealtimeEvent,
  pendingAddressIds: ReadonlySet<string>
): Map<string, unitDetails> {
  const addressId = event.record.id;
  const action = event.action;

  if (action === "delete") {
    if (!prev.has(addressId)) return prev;
    const next = new Map(prev);
    next.delete(addressId);
    return next;
  }

  if (pendingAddressIds.has(addressId)) return prev;

  const existingType = prev.get(addressId)?.type ?? [];
  const next = new Map(prev);
  next.set(addressId, {
    ...createUnitDetails(event.record),
    type: existingType
  });
  return next;
}

/**
 * Pure reducer for the `address_options` realtime subscription.
 *
 * Adds/removes a single badge on an existing address. Returns `prev` for
 * unknown addresses, idempotent operations (create when already present,
 * delete when not present), pending addresses, and unsupported actions.
 */
export function applyAddressOptionsEvent(
  prev: Map<string, unitDetails>,
  event: RealtimeEvent,
  pendingAddressIds: ReadonlySet<string>,
  options: ReadonlyMap<string, HHOptionProps>
): Map<string, unitDetails> {
  const action = event.action;
  if (action !== "create" && action !== "delete") return prev;

  const addressId = event.record.address as string;
  const optionId = event.record.option as string;

  if (pendingAddressIds.has(addressId)) return prev;

  const unit = prev.get(addressId);
  if (!unit) return prev;

  let newType: typeof unit.type;
  if (action === "create") {
    if (unit.type.some((t) => t.id === optionId)) return prev;
    newType = [
      ...unit.type,
      {
        id: optionId,
        code: options.get(optionId)?.code ?? "",
        aoId: event.record.id
      }
    ];
  } else {
    const filtered = unit.type.filter((t) => t.id !== optionId);
    if (filtered.length === unit.type.length) return prev;
    newType = filtered;
  }

  const next = new Map(prev);
  next.set(addressId, { ...unit, type: newType });
  return next;
}
