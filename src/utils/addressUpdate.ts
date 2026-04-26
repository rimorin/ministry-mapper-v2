import { createBatch, getList } from "./pocketbase";
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
  congregation,
  updateData,
  toDeleteAoIds,
  toAddOptionIds
}: {
  addressId: string;
  mapId: string;
  congregation: string;
  updateData: QueuedOp["updateData"];
  toDeleteAoIds: string[];
  toAddOptionIds: string[];
}): Promise<void> {
  const batch = createBatch();
  const addressOptions = batch.collection("address_options");

  toDeleteAoIds.forEach((aoId) => addressOptions.delete(aoId));
  toAddOptionIds.forEach((id) =>
    addressOptions.create({
      address: addressId,
      option: id,
      congregation,
      map: mapId
    })
  );

  batch.collection("addresses").update(addressId, updateData);
  await batch.send();
}

/**
 * Atomically creates an address record and its initial address_options in a
 * single batch. Using the client-generated addressId ensures PocketBase can
 * accept a custom ID and the batch is all-or-nothing — no partial state.
 */
export async function batchCreateAddress({
  addressId,
  mapId,
  congregation,
  createPayload,
  updateData,
  optionIds
}: {
  addressId: string;
  mapId: string;
  congregation: string;
  createPayload: NonNullable<QueuedOp["createPayload"]>;
  updateData: QueuedOp["updateData"];
  optionIds: string[];
}): Promise<void> {
  const batch = createBatch();
  batch.collection("addresses").create({
    id: addressId,
    ...createPayload,
    ...updateData
  });
  optionIds.forEach((optId) =>
    batch.collection("address_options").create({
      address: addressId,
      option: optId,
      congregation,
      map: mapId
    })
  );
  await batch.send();
}
