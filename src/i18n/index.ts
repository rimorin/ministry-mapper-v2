import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

i18n
  // Translations load via Vite dynamic import — each language code-splits into its own chunk.
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    // Store only the base language code ("zh" not "zh-TW") so locale maps match.
    load: "languageOnly",
    debug: import.meta.env.DEV,
    ns: ["translation"],
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false // React already safes from XSS
    }
  });

export default i18n;
