import { FC, ReactNode, useEffect, useState } from "react";
import { ThemeContext } from "../utils/context";
import { ThemeMode } from "../../utils/interface";
import { useLocalStorage } from "../../hooks/useLocalStorage";

interface ThemeMiddlewareProps {
  children: ReactNode;
}

const resolveActualTheme = (mode: ThemeMode): "light" | "dark" =>
  mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : mode;

const ThemeMiddleware: FC<ThemeMiddlewareProps> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>("mm-theme", "system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">(() =>
    resolveActualTheme(theme)
  );

  useEffect(() => {
    const applyTheme = (newTheme: "light" | "dark") => {
      document.documentElement.setAttribute("data-bs-theme", newTheme);
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeMiddleware;
