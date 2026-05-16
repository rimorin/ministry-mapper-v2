import { use, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageContext } from "../../i18n/LanguageContext";
import useUIState from "../../hooks/useUIManagement";
import LanguageSelector from "../../i18n/LanguageSelector";
import ThemeToggle from "./themetoggle";
import ReleaseHistoryBtn from "./releasehistorybtn";
import LanguageBtn from "./languagebtn";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import * as m from "motion/react-m";
import { springBase } from "@/lib/motion";

const { VITE_ABOUT_URL } = import.meta.env;
const AboutURL = (VITE_ABOUT_URL ||
  "https://doc.ministry-mapper.com/user-guide") as string;

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);
  const { showLanguageSelector, toggleLanguageSelector } = useUIState();

  const handleLanguageSelect = (language: string) => {
    changeLanguage(language);
    toggleLanguageSelector();
  };

  return (
    <div className="h-dvh overflow-y-auto flex flex-col items-center bg-background px-6 md:px-10">
      <LanguageSelector
        showListing={showLanguageSelector}
        hideFunction={toggleLanguageSelector}
        handleSelect={handleLanguageSelect}
        currentLanguage={currentLanguage}
        languageOptions={languageOptions}
      />

      <div className="my-auto w-full max-w-sm flex flex-col gap-6 py-8">
        <m.a
          className="flex items-center gap-2 self-center font-medium"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springBase}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={getAssetUrl("favicon-32x32.png")}
            width="28"
            height="28"
            alt={t("branding.logo", "Ministry Mapper logo")}
            className="dark:brightness-150"
          />
          <span>{t("branding.name", "Ministry Mapper")}</span>
        </m.a>

        <m.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...springBase, delay: 0.1 }}
        >
          {children}
        </m.div>
      </div>

      <m.div
        className="w-full max-w-sm flex items-center justify-center gap-2 pb-6 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className="flex flex-col items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(AboutURL)}
          >
            <Info className="size-4" />
          </Button>
          <span className="text-[10px]">{t("navigation.about", "About")}</span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <ReleaseHistoryBtn />
          <span className="text-[10px]">
            {t("releaseNotes.historyShort", "Updates")}
          </span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <ThemeToggle />
          <span className="text-[10px]">
            {t("theme.settingsShort", "Theme")}
          </span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <LanguageBtn onClick={toggleLanguageSelector} />
          <span className="text-[10px]">
            {t("common.Language", "Language")}
          </span>
        </span>
      </m.div>
    </div>
  );
};

export default AuthLayout;
