/**
 * Generates a 15-character lowercase alphanumeric ID matching PocketBase's
 * autogenerate pattern `[a-z0-9]{15}`.
 */
export function generateRecordId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % 36]).join("");
}
