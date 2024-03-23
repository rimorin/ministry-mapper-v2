import "react-calendar/dist/Calendar.css";
import "./css/main.css";
import "./css/common.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import Main from "./pages/index";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";
import { Provider } from "@rollbar/react";
import { DEFEAULT_ROLLBAR_ENVIRONMENT } from "./utils/constants";
import reportWebVitals from "./reportWebVitals";
// import { CssBaseline, CssVarsProvider, GlobalStyles } from "@mui/joy";
const { VITE_ROLLBAR_ACCESS_TOKEN, VITE_ROLLBAR_ENVIRONMENT, VITE_VERSION } =
  import.meta.env;

const rollbarConfig = {
  accessToken: VITE_ROLLBAR_ACCESS_TOKEN,
  payload: {
    environment: VITE_ROLLBAR_ENVIRONMENT || DEFEAULT_ROLLBAR_ENVIRONMENT,
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: VITE_VERSION
      }
    }
  }
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <StrictMode>
    <Provider config={rollbarConfig}>
      <BrowserRouter>
        <Main />
      </BrowserRouter>
      {/* </CssVarsProvider> */}
    </Provider>
  </StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
