import { FC, ReactNode, useEffect, useState } from "react";
import { ThemeContext } from "../utils/context";
import { ThemeMode } from "../../utils/interface";
import { useLocalStorage } from "../../hooks/useLocalStorage";

interface ThemeMiddlewareProps {
  children: ReactNode;
}

const ThemeMiddleware: FC<ThemeMiddlewareProps> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>("mm-theme", "system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const getSystemTheme = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const applyTheme = (newTheme: "light" | "dark") => {
      document.documentElement.setAttribute("data-bs-theme", newTheme);
      setActualTheme(newTheme);
    };

    if (theme === "system") {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeMiddleware;
