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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeContext } from "../utils/context";
import { ColorTheme, ThemeMode } from "../../utils/interface";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";

interface ColorThemeOption {
  id: ColorTheme;
  nameKey: string;
  nameFallback: string;
  swatch: { light: string; dark: string };
}

const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: "default",
    nameKey: "theme.colors.default",
    nameFallback: "Classic",
    swatch: { light: "#171717", dark: "#fafafa" }
  },
  {
    id: "tangerine",
    nameKey: "theme.colors.tangerine",
    nameFallback: "Tangerine",
    swatch: { light: "#cd4b25", dark: "#ff8562" }
  },
  {
    id: "perpetuity",
    nameKey: "theme.colors.perpetuity",
    nameFallback: "Perpetuity",
    swatch: { light: "#01838c", dark: "#4de8e8" }
  },
  {
    id: "cosmic",
    nameKey: "theme.colors.cosmic",
    nameFallback: "Cosmic Night",
    swatch: { light: "#6e56cf", dark: "#a48fff" }
  },
  {
    id: "mocha",
    nameKey: "theme.colors.mocha",
    nameFallback: "Mocha Mousse",
    swatch: { light: "#966b59", dark: "#c39e88" }
  }
];

const ThemeSettingsModal = NiceModal.create(() => {
  const { modal, dialogProps, contentProps } = useBaseUiDialog();
  const { t } = useTranslation();
  const { theme, setTheme, actualTheme, colorTheme, setColorTheme } =
    use(ThemeContext);
  const { trackEvent } = useAnalytics();

  const handleThemeChange = (selectedTheme: ThemeMode) => {
    setTheme(selectedTheme);
    trackEvent(ANALYTICS_EVENTS.THEME_CHANGED, { theme: selectedTheme });
  };

  const handleColorThemeChange = (selectedColorTheme: ColorTheme) => {
    setColorTheme(selectedColorTheme);
    trackEvent(ANALYTICS_EVENTS.THEME_CHANGED, {
      theme,
      colorTheme: selectedColorTheme
    });
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

          <div className="mt-4">
            <div className="font-semibold mb-2">
              {t("theme.colors.title", "Color")}
            </div>
            <RadioGroup
              className="grid grid-cols-5 items-start justify-items-center gap-1"
              value={colorTheme}
              onValueChange={(value) =>
                handleColorThemeChange(value as ColorTheme)
              }
            >
              {COLOR_THEMES.map((option) => (
                <label
                  key={option.id}
                  className="group flex w-full min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-md p-1.5"
                >
                  <RadioGroupItem
                    value={option.id}
                    className="size-9 border-border shadow-sm data-checked:border-transparent data-checked:ring-2 data-checked:ring-ring data-checked:ring-offset-2 data-checked:ring-offset-popover"
                    style={{ backgroundColor: option.swatch[actualTheme] }}
                  />
                  <span className="text-center text-xs leading-tight text-muted-foreground group-has-data-checked:font-medium group-has-data-checked:text-foreground">
                    {t(option.nameKey, option.nameFallback)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>
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
