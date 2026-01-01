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
      "validation.maxLength": "Maximum length is {{max}}"
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
