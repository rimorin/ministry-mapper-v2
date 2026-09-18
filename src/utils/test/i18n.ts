import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translation from "../../i18n/locales/en/translation.json";

// The real en bundle, so tests assert the same strings production renders.
// A hand-maintained subset here silently drifts from the shipped copy.
i18n.use(initReactI18next).init({
  resources: { en: { translation } },
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
