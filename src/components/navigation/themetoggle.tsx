import { FC, lazy, use } from "react";
import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import { useModalManagement } from "../../hooks/useModalManagement";
import { ThemeContext } from "../utils/context";
import GenericButton from "./button";

const ThemeSettingsModal = lazy(() => import("../modal/themesettings"));

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: FC<ThemeToggleProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  use(ThemeContext);
  const { showModal } = useModalManagement();

  const handleOpenThemeSettings = () => {
    showModal(ThemeSettingsModal, {});
  };

  return (
    <GenericButton
      variant="outline"
      size="sm"
      onClick={handleOpenThemeSettings}
      className={className}
      aria-label={t("theme.settings", "Theme Settings")}
      title={t("theme.settings", "Theme Settings")}
      label={
        <Palette
          aria-hidden="true"
          style={{ width: "1.25em", height: "1.25em" }}
        />
      }
    />
  );
};

export default ThemeToggle;
