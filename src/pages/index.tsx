import "../App.scss";
import "../css/main.css";
import "../css/common.css";
import "react-calendar/dist/Calendar.css";
import { FC, ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import MaintenanceMiddleware from "../components/middlewares/maintenance";
import MainMiddleware from "../components/middlewares/main";
import StateMiddleware from "../components/middlewares/context";
import MapsMiddleware from "../components/middlewares/googlemap";
import RollbarMiddleware from "../components/middlewares/rollbar";
import { Provider as NiceModelMiddleware } from "@ebay/nice-modal-react";
import router from "./router";

interface CombinedMiddlewareProps {
  children: ReactNode;
}

const CombinedMiddleware: FC<CombinedMiddlewareProps> = ({ children }) => (
  <RollbarMiddleware>
    <MainMiddleware>
      <MaintenanceMiddleware>
        <MapsMiddleware>
          <NiceModelMiddleware>
            <StateMiddleware>{children}</StateMiddleware>
          </NiceModelMiddleware>
        </MapsMiddleware>
      </MaintenanceMiddleware>
    </MainMiddleware>
  </RollbarMiddleware>
);

const Main: FC = () => {
  return (
    <CombinedMiddleware>
      <RouterProvider router={router} />
    </CombinedMiddleware>
  );
};

export default Main;
