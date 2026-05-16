import NiceModal from "@ebay/nice-modal-react";
import { use } from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeContext } from "../utils/context";
import { ThemeMode } from "../../utils/interface";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";

const ThemeSettingsModal = NiceModal.create(() => {
  const { modal, dialogProps, contentProps } = useBaseUiDialog();
  const { t } = useTranslation();
  const { theme, setTheme } = use(ThemeContext);
  const { trackEvent } = useAnalytics();

  const handleThemeChange = (selectedTheme: ThemeMode) => {
    setTheme(selectedTheme);
    trackEvent(ANALYTICS_EVENTS.THEME_CHANGED, { theme: selectedTheme });
  };

  const handleClose = () => {
    modal.hide();
  };

  return (
    <Dialog {...dialogProps}>
      <DialogContent {...contentProps}>
        <DialogHeader>
          <DialogTitle>{t("theme.settings", "Theme Settings")}</DialogTitle>
        </DialogHeader>
        <div>
          <p className="mb-3 text-muted-foreground">
            {t(
              "theme.description",
              "Choose your preferred theme or follow your system settings"
            )}
          </p>

          <label
            htmlFor="theme-light"
            className="flex items-center gap-3 mb-3 cursor-pointer"
          >
            <input
              type="radio"
              className="mt-0.5 accent-primary"
              id="theme-light"
              name="theme-selection"
              checked={theme === "light"}
              onChange={() => handleThemeChange("light")}
            />
            <span role="img" aria-hidden="true">
              ☀️
            </span>
            <div>
              <div className="font-semibold">{t("theme.light", "Light")}</div>
              <small className="text-muted-foreground">
                {t("theme.lightDescription", "Bright and clear theme")}
              </small>
            </div>
          </label>

          <label
            htmlFor="theme-dark"
            className="flex items-center gap-3 mb-3 cursor-pointer"
          >
            <input
              type="radio"
              className="mt-0.5 accent-primary"
              id="theme-dark"
              name="theme-selection"
              checked={theme === "dark"}
              onChange={() => handleThemeChange("dark")}
            />
            <span role="img" aria-hidden="true">
              🌙
            </span>
            <div>
              <div className="font-semibold">{t("theme.dark", "Dark")}</div>
              <small className="text-muted-foreground">
                {t("theme.darkDescription", "Easy on the eyes")}
              </small>
            </div>
          </label>

          <label
            htmlFor="theme-system"
            className="flex items-center gap-3 mb-3 cursor-pointer"
          >
            <input
              type="radio"
              className="mt-0.5 accent-primary"
              id="theme-system"
              name="theme-selection"
              checked={theme === "system"}
              onChange={() => handleThemeChange("system")}
            />
            <span role="img" aria-hidden="true">
              💻
            </span>
            <div>
              <div className="font-semibold">{t("theme.system", "System")}</div>
              <small className="text-muted-foreground">
                {t("theme.systemDescription", "Follows your device settings")}
              </small>
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            {t("common.close", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ThemeSettingsModal;
