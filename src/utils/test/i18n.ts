import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Common
      "common.cancel": "Cancel",
      "common.confirm": "Confirm",
      "common.delete": "Delete",
      "common.save": "Save",
      "common.edit": "Edit",
      "common.create": "Create",
      "common.update": "Update",
      "common.close": "Close",
      "common.submit": "Submit",
      "common.back": "Back",
      "common.next": "Next",
      "common.previous": "Previous",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.sort": "Sort",
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.warning": "Warning",
      "common.info": "Info",
      "common.selectLanguage": "Select Language",

      // Territory
      "territory.deleteWarning": "⚠️ WARNING: Deleting territory...",
      "territory.deleteTitle": "Delete Territory",
      "territory.code": "Territory Code",
      "territory.name": "Territory Name",
      "territory.assignedTo": "Assigned to",
      "territory.status": "Status",

      // Map
      "map.name": "Map Name",
      "map.address": "Address",
      "map.unit": "Unit",
      "map.floor": "Floor",
      "map.sequence": "Sequence",
      "map.sequencePlaceholder":
        "Type and press Enter to add (e.g., 1A, 1B, 301, 302)",
      "map.sequenceNoOptions": "Type and press Enter to add",
      "map.sequenceAdd": 'Add "{{value}}"',
      "map.sequenceHelpText":
        "Define the order in which properties should be visited within this map",
      "map.invalidSequence": "Invalid sequence",

      // User
      "user.email": "Email",
      "user.password": "Password",
      "user.name": "Name",
      "user.role": "Role",

      // Links
      "links.personal": "Personal",
      "links.assignment": "Assign",

      // Validation
      "validation.required": "This field is required",
      "validation.email": "Invalid email address",
      "validation.minLength": "Minimum length is {{min}}",
      "validation.maxLength": "Maximum length is {{max}}",

      // TagField
      "tagfield.invalidCharacters":
        "Only alphanumeric characters and hyphens are allowed",
      "tagfield.charactersSanitized": "Invalid characters removed",
      "tagfield.duplicatesRemoved": "Duplicate tags removed",

      // Unit
      "unit.placeholder":
        "Type and press Enter to add (e.g., 1A, 2B, 301, 302)",
      "unit.noOptions": "Type and press Enter to add",
      "unit.add": 'Add "{{value}}"',
      "unit.requireOneUnitValidation":
        "Territory requires at least 1 unit number."
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
});

export default i18n;
