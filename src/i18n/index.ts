import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

// Initialize i18next with lazy-loaded translations
i18n
  // Load translations dynamically using Vite's dynamic import
  // Each language will be code-split into a separate chunk
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
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
    // Default namespace
    ns: ["translation"],
    defaultNS: "translation",
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
