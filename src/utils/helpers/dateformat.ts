// e.g. "Thu, 12 Nov 2026, 2:32 pm". The month is spelled out because
// "12/11/26" reads as a different day to someone used to month-first dates.
const formatDate = (dateString: number | string | Date): string => {
  return new Date(dateString).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};

export default formatDate;
