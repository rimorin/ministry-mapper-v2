import React from "react";
import { StateType, ThemeContextType } from "../../utils/interface";

// Create a new context with a default value
const StateContext = React.createContext<StateType>({
  frontPageMode: "login",
  setFrontPageMode: () => {}
});

// Theme context
const ThemeContext = React.createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  actualTheme: "light"
});

export { StateContext, ThemeContext };
