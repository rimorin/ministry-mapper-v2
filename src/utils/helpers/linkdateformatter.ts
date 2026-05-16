import i18n from "../../i18n";

const createFormatter = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeStyle: "short",
    dateStyle: "medium"
  };
  try {
    return new Intl.DateTimeFormat(i18n.language || "en", options);
  } catch {
    return new Intl.DateTimeFormat("en", options);
  }
};

let LinkDateFormatter = createFormatter();

i18n.on("languageChanged", () => {
  LinkDateFormatter = createFormatter();
});

export { LinkDateFormatter as default };
