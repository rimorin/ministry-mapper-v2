import i18n from "../../i18n";

export const formatExpiry = (hours: number): string => {
  if (!Number.isFinite(hours) || hours <= 0)
    return i18n.t("expiry.hour", { count: 1, defaultValue: "1 hour" });
  if (hours <= 1)
    return i18n.t("expiry.hour", { count: 1, defaultValue: "1 hour" });
  if (hours < 24)
    return i18n.t("expiry.hour", {
      count: hours,
      defaultValue: `${hours} hours`
    });
  const days = Math.floor(hours / 24);
  if (days < 7)
    return i18n.t("expiry.day", {
      count: days,
      defaultValue: days === 1 ? "1 day" : `${days} days`
    });
  const weeks = Math.floor(days / 7);
  if (days < 30)
    return i18n.t("expiry.week", {
      count: weeks,
      defaultValue: weeks === 1 ? "1 week" : `${weeks} weeks`
    });
  const months = Math.max(Math.floor(days / 30), 1);
  return i18n.t("expiry.month", {
    count: months,
    defaultValue: months === 1 ? "1 month" : `${months} months`
  });
};

const assignmentMessage = (
  address: string,
  publisherName = "",
  expiryHrs = 0,
  linkType = "normal"
) => {
  const currentDate = new Date();
  const hrs = currentDate.getHours();

  let greetKey;

  if (hrs < 12) {
    greetKey = "greetings.morning";
  } else if (hrs >= 12 && hrs < 17) {
    greetKey = "greetings.afternoon";
  } else {
    greetKey = "greetings.evening";
  }

  // Default greeting values as fallbacks
  const defaultGreeting =
    hrs < 12 ? "Morning" : hrs < 17 ? "Afternoon" : "Evening";
  const greetingText = i18n.t(greetKey, {
    defaultValue: defaultGreeting
  });

  const isPersonal = linkType === "personal";

  if (isPersonal) {
    const expiryText = formatExpiry(expiryHrs);
    return i18n.t("assignments.personalSlip", {
      greeting: greetingText,
      address: address,
      publisherName: publisherName,
      expiryHrs: expiryText,
      defaultValue: `Good ${greetingText}, ${publisherName}!!\n\nYou have a personal slip for ${address}.\n\nThis link expires in ${expiryText}.\n\nPlease click on the link below to proceed.`
    });
  }

  return i18n.t("assignments.normalAssignment", {
    greeting: greetingText,
    address: address,
    publisherName: publisherName,
    defaultValue: `Good ${greetingText}, ${publisherName}!!\n\nYou are assigned to ${address}.\n\nPlease click on the link below to proceed.`
  });
};

export default assignmentMessage;
