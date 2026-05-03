import { callFunction, getList } from "./pocketbase";
import type { QueuedOp } from "./interface";

/**
 * Fetches all address_options records for an address and returns a
 * Map<optionId, aoRecordId> for fast lookup.
 * mapId is required because the backend listRule enforces `filter ~ "map="`.
 */
export async function fetchAddressOptionMap(
  addressId: string,
  mapId: string
): Promise<Map<string, string>> {
  const serverOptions = await getList("address_options", {
    filter: `address="${addressId}" && map="${mapId}"`,
    fields: "id,option"
  });
  return new Map(serverOptions.map((o) => [o.option as string, o.id]));
}

/**
 * Builds and sends a single atomic batch:
 * - Deletes the given address_options records (by ao record ID)
 * - Creates new address_options records for the given option IDs
 * - Updates the address record with the provided data
 */
export async function batchUpdateAddress({
  addressId,
  mapId,
  updateData,
  toDeleteAoIds,
  toAddOptionIds
}: {
  addressId: string;
  mapId: string;
  updateData: QueuedOp["updateData"];
  toDeleteAoIds: string[];
  toAddOptionIds: string[];
}): Promise<void> {
  await callFunction("/address/update", {
    method: "POST",
    body: {
      address_id: addressId,
      map_id: mapId,
      notes: updateData.notes,
      status: updateData.status,
      not_home_tries: updateData.not_home_tries,
      dnc_time: updateData.dnc_time,
      coordinates: updateData.coordinates
        ? JSON.parse(updateData.coordinates)
        : null,
      updated_by: updateData.updated_by,
      delete_ao_ids: toDeleteAoIds,
      add_option_ids: toAddOptionIds
    }
  });
}

/**
 * Creates an address record and its initial address_options via the
 * /address/add endpoint.
 */
export async function batchCreateAddress({
  addressId,
  mapId,
  createPayload,
  updateData,
  optionIds
}: {
  addressId: string;
  mapId: string;
  createPayload: NonNullable<QueuedOp["createPayload"]>;
  updateData: QueuedOp["updateData"];
  optionIds: string[];
}): Promise<void> {
  await callFunction("/address/add", {
    method: "POST",
    body: {
      address_id: addressId,
      map_id: mapId,
      ...createPayload,
      notes: updateData.notes,
      status: updateData.status,
      not_home_tries: updateData.not_home_tries,
      dnc_time: updateData.dnc_time,
      coordinates: updateData.coordinates
        ? JSON.parse(updateData.coordinates)
        : null,
      updated_by: updateData.updated_by,
      add_option_ids: optionIds
    }
  });
}
