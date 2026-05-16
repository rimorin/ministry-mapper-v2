import { createContext, FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LanguageContextType, LanguageProviderProps } from "../utils/interface";

export const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "en",
  changeLanguage: () => {},
  languageOptions: []
});

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "zh", label: "中文" },
  { value: "ta", label: "தமிழ்" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "ms", label: "B. Melayu" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" }
];

export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
  const { i18n: i18nInstance } = useTranslation();
  const currentLanguage = i18nInstance.language || "en";

  const changeLanguage = useCallback(
    (language: string) => {
      i18nInstance.changeLanguage(language);
      localStorage.setItem("i18nextLng", language);
    },
    [i18nInstance]
  );

  const contextValue = useMemo(
    () => ({
      currentLanguage,
      changeLanguage,
      languageOptions: LANGUAGE_OPTIONS
    }),
    [currentLanguage, changeLanguage]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
