import { pb } from "../pocketbase";

/**
 * Unsubscribes from a list of collections.
 *
 * @param {string[]} collections - An array of collection names to unsubscribe from.
 * @returns {Promise<void>} A promise that resolves when all unsubscriptions are complete.
 */
export const unsubscriber = async (collections: string[]) => {
  if (!collections) return;
  await Promise.all(
    collections.map((collection) => pb.collection(collection).unsubscribe())
  );
};
