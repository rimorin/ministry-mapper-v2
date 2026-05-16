import React from "react";
import { ThemeContextType } from "../../utils/interface";

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  actualTheme: "light"
});

export { ThemeContext };
