import "../App.scss";
import "../css/main.css";
import "../css/common.css";
import "../css/toast.css";
import "../css/darkmode.css";
import "react-calendar/dist/Calendar.css";
import "leaflet/dist/leaflet.css";
import { FC, ReactNode } from "react";
import MaintenanceMiddleware from "../components/middlewares/maintenance";
import MainMiddleware from "../components/middlewares/main";
import StateMiddleware from "../components/middlewares/context";
import ThemeMiddleware from "../components/middlewares/theme";
import { Provider as NiceModelMiddleware } from "@ebay/nice-modal-react";
import Router from "./router";
import "../i18n";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ToastProvider } from "../components/middlewares/toast";

interface CombinedMiddlewareProps {
  children: ReactNode;
}

const CombinedMiddleware: FC<CombinedMiddlewareProps> = ({ children }) => (
  <MainMiddleware>
    <LanguageProvider>
      <ThemeMiddleware>
        <ToastProvider>
          <MaintenanceMiddleware>
            <NiceModelMiddleware>
              <StateMiddleware>{children}</StateMiddleware>
            </NiceModelMiddleware>
          </MaintenanceMiddleware>
        </ToastProvider>
      </ThemeMiddleware>
    </LanguageProvider>
  </MainMiddleware>
);

const Main: FC = () => {
  return <CombinedMiddleware>{Router()}</CombinedMiddleware>;
};

export default Main;
