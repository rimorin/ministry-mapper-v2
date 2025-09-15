import React from "react";
import { StateType } from "../../utils/interface";

// Create a new context with a default value
const StateContext = React.createContext<StateType>({
  frontPageMode: "login",
  setFrontPageMode: () => {}
});

export { StateContext };
