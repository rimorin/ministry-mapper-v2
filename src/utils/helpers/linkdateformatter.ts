import i18n from "../../i18n";

// Function that creates a new formatter based on the current language
const createFormatter = () => {
  return new Intl.DateTimeFormat(i18n.language || "en", {
    timeStyle: "short",
    dateStyle: "medium"
  });
};

// Initial formatter
let LinkDateFormatter = createFormatter();

// Update formatter when language changes
i18n.on("languageChanged", () => {
  LinkDateFormatter = createFormatter();
});

export default LinkDateFormatter;
