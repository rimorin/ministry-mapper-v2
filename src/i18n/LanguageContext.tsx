import { createContext, useState, useEffect, FC } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./index";
import { LanguageContextType, LanguageProviderProps } from "../utils/interface";

export const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "en",
  changeLanguage: () => {},
  languageOptions: []
});

export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "en");
  const { i18n: i18nInstance } = useTranslation();

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "ta", label: "தமிழ்" },
    { value: "id", label: "Bahasa Indonesia" },
    { value: "ms", label: "B. Melayu" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" }
  ];

  useEffect(() => {
    setCurrentLanguage(i18nInstance.language || "en");
  }, [i18nInstance.language]);

  const changeLanguage = (language: string) => {
    i18nInstance.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        languageOptions
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
