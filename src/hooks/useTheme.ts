import { useContext } from "react";
import { ThemeContext } from "../components/utils/context";

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeMiddleware");
  }

  return context;
};
