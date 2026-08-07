import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../utils/context";
import { ColorTheme, ThemeMode } from "../../utils/interface";
import { useLocalStorage } from "../../hooks/useLocalStorage";

interface ThemeMiddlewareProps {
  children: ReactNode;
}

const VALID_COLOR_THEMES: ColorTheme[] = [
  "default",
  "tangerine",
  "perpetuity",
  "cosmic",
  "mocha"
];

const resolveActualTheme = (mode: ThemeMode): "light" | "dark" =>
  mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : mode;

const ThemeMiddleware: FC<ThemeMiddlewareProps> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>("mm-theme", "system");
  const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>(
    "mm-color-theme",
    "default"
  );
  const [actualTheme, setActualTheme] = useState<"light" | "dark">(() =>
    resolveActualTheme(theme)
  );

  // Stored value may predate a renamed/removed theme — fall back to default.
  const activeColorTheme = VALID_COLOR_THEMES.includes(colorTheme)
    ? colorTheme
    : "default";

  useEffect(() => {
    const applyTheme = (newTheme: "light" | "dark") => {
      document.documentElement.classList.toggle("dark", newTheme === "dark"); // shadcn dark mode
      setActualTheme(newTheme);
    };

    applyTheme(resolveActualTheme(theme));

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) =>
        applyTheme(e.matches ? "dark" : "light");

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    if (activeColorTheme === "default") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = activeColorTheme;
    }
  }, [activeColorTheme]);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      actualTheme,
      colorTheme: activeColorTheme,
      setColorTheme
    }),
    [theme, setTheme, actualTheme, activeColorTheme, setColorTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeMiddleware;
