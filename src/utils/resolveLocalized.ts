import type { LocalizedString } from "../hooks/useReleaseNotes";

/**
 * Resolves a LocalizedString to a plain string for the given language.
 * Fallback chain: requested lang → "en" → first available key → "".
 */
export function resolveLocalized(
  value: LocalizedString | null | undefined,
  lang: string,
  fallback = "en"
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  // Strip subtag (e.g. "zh-TW" → "zh") so browser-detected locales still match.
  const baseLang = lang.split("-")[0];
  return (
    value[lang] ??
    value[baseLang] ??
    value[fallback] ??
    Object.values(value)[0] ??
    ""
  );
}
