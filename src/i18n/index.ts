import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enTranslation from "./locales/en.json";
import zhTranslation from "./locales/zh.json";
import taTranslation from "./locales/ta.json";
import idTranslation from "./locales/id.json";
import msTranslation from "./locales/ms.json";
import jaTranslation from "./locales/ja.json";
import koTranslation from "./locales/ko.json";

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize
  .init({
    // Default language
    fallbackLng: "en",
    // Debug mode in development
    debug: import.meta.env.DEV,
    // Resources with translations
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      },
      ta: {
        translation: taTranslation
      },
      id: {
        translation: idTranslation
      },
      ms: {
        translation: msTranslation
      },
      ja: {
        translation: jaTranslation
      },
      ko: {
        translation: koTranslation
      }
    },
    // Language detection options
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    },
    // Interpolation configuration
    interpolation: {
      escapeValue: false // React already safes from XSS
    }
  });

export default i18n;
