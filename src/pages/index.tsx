import "../App.scss";
import "../css/main.css";
import "../css/common.css";
import "react-calendar/dist/Calendar.css";
import { FC, ReactNode } from "react";
import MaintenanceMiddleware from "../components/middlewares/maintenance";
import MainMiddleware from "../components/middlewares/main";
import StateMiddleware from "../components/middlewares/context";
import MapsMiddleware from "../components/middlewares/googlemap";
import { Provider as NiceModelMiddleware } from "@ebay/nice-modal-react";
import Router from "./router";
import "../i18n";
import { LanguageProvider } from "../i18n/LanguageContext";

interface CombinedMiddlewareProps {
  children: ReactNode;
}

const CombinedMiddleware: FC<CombinedMiddlewareProps> = ({ children }) => (
  <MainMiddleware>
    <LanguageProvider>
      <MaintenanceMiddleware>
        <MapsMiddleware>
          <NiceModelMiddleware>
            <StateMiddleware>{children}</StateMiddleware>
          </NiceModelMiddleware>
        </MapsMiddleware>
      </MaintenanceMiddleware>
    </LanguageProvider>
  </MainMiddleware>
);

const Main: FC = () => {
  return <CombinedMiddleware>{Router()}</CombinedMiddleware>;
};

export default Main;
