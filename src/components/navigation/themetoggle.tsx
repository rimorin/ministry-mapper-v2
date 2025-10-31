import { FC, lazy, use } from "react";
import { Button, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useModalManagement } from "../../hooks/useModalManagement";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { ThemeContext } from "../utils/context";

const ThemeSettingsModal = lazy(() => import("../modal/themesettings"));

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: FC<ThemeToggleProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { actualTheme } = use(ThemeContext);
  const { showModal } = useModalManagement();

  const handleOpenThemeSettings = () => {
    showModal(ThemeSettingsModal, {});
  };

  return (
    <Button
      variant="outline-primary"
      size="sm"
      onClick={handleOpenThemeSettings}
      className={className}
      aria-label={t("theme.settings", "Theme Settings")}
      title={t("theme.settings", "Theme Settings")}
    >
      <Image
        src={getAssetUrl("dark-theme.svg")}
        alt=""
        aria-hidden="true"
        style={{
          width: "1.25em",
          height: "1.25em",
          filter: actualTheme === "dark" ? "brightness(0) invert(1)" : "none"
        }}
      />
    </Button>
  );
};

export default ThemeToggle;
