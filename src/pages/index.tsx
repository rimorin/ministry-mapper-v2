import "../css/variables.css";
import "../css/main.css";
import "../css/common.css";
import "@/index.css";
import { FC, lazy, ReactNode, Suspense } from "react";
import Loader from "../components/statics/loader";
import MaintenanceMiddleware from "../components/middlewares/maintenance";
import MainMiddleware from "../components/middlewares/main";
import ThemeMiddleware from "../components/middlewares/theme";
import { Provider as NiceModelMiddleware } from "@ebay/nice-modal-react";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import Router from "./router";
import "../i18n";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ReleaseNotesProvider } from "../components/middlewares/releasenotescontext";
import SwUpdatePrompt from "../components/middlewares/swupdateprompt";

interface CombinedMiddlewareProps {
  children: ReactNode;
}

// Lazy so the Base UI toast subtree stays off the initial preload path. The
// manager in toast-manager.ts is synchronous, so a toast fired before this
// chunk mounts is only lost during that brief window.
const Toaster = lazy(() =>
  import("@/components/ui/toast").then((module) => ({
    default: module.Toaster
  }))
);

const CombinedMiddleware: FC<CombinedMiddlewareProps> = ({ children }) => (
  // The Suspense boundary covers the lazily-loaded translation chunk
  // (i18next-resources-to-backend): useTranslation() consumers below suspend
  // until it arrives. Without a boundary here the whole root suspends with
  // no fallback, which React treats as an error.
  <Suspense fallback={<Loader />}>
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <MainMiddleware>
          <LanguageProvider>
            <ThemeMiddleware>
              <Suspense fallback={null}>
                <Toaster />
              </Suspense>
              <SwUpdatePrompt />
              <MaintenanceMiddleware>
                <NiceModelMiddleware>
                  <ReleaseNotesProvider>{children}</ReleaseNotesProvider>
                </NiceModelMiddleware>
              </MaintenanceMiddleware>
            </ThemeMiddleware>
          </LanguageProvider>
        </MainMiddleware>
      </MotionConfig>
    </LazyMotion>
  </Suspense>
);

const Main: FC = () => {
  return (
    <CombinedMiddleware>
      <Router />
    </CombinedMiddleware>
  );
};

export default Main;
