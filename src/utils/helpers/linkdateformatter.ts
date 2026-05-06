import i18n from "../../i18n";

// Function that creates a new formatter based on the current language
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

// Initial formatter
let LinkDateFormatter = createFormatter();

// Update formatter when language changes
i18n.on("languageChanged", () => {
  LinkDateFormatter = createFormatter();
});

export default LinkDateFormatter;
