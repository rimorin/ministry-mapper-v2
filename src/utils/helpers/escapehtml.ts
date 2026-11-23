const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

/**
 * Makes a value safe to put into an HTML string, as text or inside a quoted
 * attribute. Leaflet's divIcon takes its markup as a string and the browser
 * parses it, so anything a person typed (a territory code, a household type)
 * must go through here first, or it is read as markup and can run as script.
 * React escapes its own output; this is only for the strings built by hand.
 */
const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ENTITIES[char]);

export default escapeHtml;
