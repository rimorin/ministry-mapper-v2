/**
 * Formats a given date into a string with the format "weekday, day/month/year, hour:minute AM/PM".
 * The date is formatted according to the "en-GB" locale.
 *
 * @param {number | string | Date} dateString - The date to format. It can be a number (timestamp), a string, or a Date object.
 * @returns {string} The formatted date string.
 *
 * @example
 * // Example usage:
 * const formattedDate = formatDate(new Date());
 * console.log(formattedDate); // Output: "Tue, 21/09/21, 10:30 AM"
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
