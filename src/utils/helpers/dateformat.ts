/**
 * Formats a date in the "en-GB" locale, e.g. "Tue, 21/09/21, 10:30 AM".
 */
const formatDate = (dateString: number | string | Date): string => {
  return new Date(dateString).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export default formatDate;
