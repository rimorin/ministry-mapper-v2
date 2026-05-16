import "../css/variables.css";
import "../css/main.css";
import "../css/common.css";
import "@/index.css";
import { FC, ReactNode } from "react";
import MaintenanceMiddleware from "../components/middlewares/maintenance";
import PwaMiddleware from "../components/middlewares/pwa";
import MainMiddleware from "../components/middlewares/main";
import ThemeMiddleware from "../components/middlewares/theme";
import { Provider as NiceModelMiddleware } from "@ebay/nice-modal-react";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import Router from "./router";
import "../i18n";
import { LanguageProvider } from "../i18n/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { ReleaseNotesProvider } from "../components/middlewares/releasenotescontext";
import SwUpdatePrompt from "../components/middlewares/swupdateprompt";

interface CombinedMiddlewareProps {
  children: ReactNode;
}

const CombinedMiddleware: FC<CombinedMiddlewareProps> = ({ children }) => (
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <MainMiddleware>
        <LanguageProvider>
          <ThemeMiddleware>
            <Toaster />
            <SwUpdatePrompt />
            <MaintenanceMiddleware>
              <PwaMiddleware>
                <NiceModelMiddleware>
                  <ReleaseNotesProvider>{children}</ReleaseNotesProvider>
                </NiceModelMiddleware>
              </PwaMiddleware>
            </MaintenanceMiddleware>
          </ThemeMiddleware>
        </LanguageProvider>
      </MainMiddleware>
    </MotionConfig>
  </LazyMotion>
);

const Main: FC = () => {
  return (
    <CombinedMiddleware>
      <Router />
    </CombinedMiddleware>
  );
};

export default Main;
