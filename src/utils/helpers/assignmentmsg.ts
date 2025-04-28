import i18n from "../../i18n";

const assignmentMessage = (address: string) => {
  const currentDate = new Date();
  const hrs = currentDate.getHours();

  let greetKey;

  if (hrs < 12) greetKey = "greetings.morning";
  else if (hrs >= 12 && hrs < 17) greetKey = "greetings.afternoon";
  else if (hrs >= 17 && hrs <= 24) greetKey = "greetings.evening";

  // Default greeting values as fallbacks
  const defaultGreeting =
    hrs < 12 ? "Morning" : hrs < 17 ? "Afternoon" : "Evening";
  const greetingText = i18n.t(greetKey || "greetings.default", {
    defaultValue: defaultGreeting
  });

  return i18n.t("assignments.assignmentMessage", {
    greeting: greetingText,
    address: address,
    defaultValue: `Good ${greetingText}!! You are assigned to ${address}. Please click on the link below to proceed.`
  });
};

export default assignmentMessage;
