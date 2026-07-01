import { callFunction, getList } from "./pocketbase";
import type { QueuedOp } from "./interface";

// mapId is required because the backend listRule enforces `filter ~ "map="`.
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

// Sent as a single request so the delete/create/update apply atomically.
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
      delete_ao_ids: toDeleteAoIds,
      add_option_ids: toAddOptionIds
    }
  });
}

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
      add_option_ids: optionIds
    }
  });
}
