/** Formatting only; invalid imported dates must not break the learning workspace. */
export function learningDate(
  value: string,
  language: string,
  includeYear = false,
): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp))
    return language === "hi" ? "तारीख उपलब्ध नहीं" : "Date unavailable";
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
    timeZone: "Asia/Calcutta",
  }).format(timestamp);
}
