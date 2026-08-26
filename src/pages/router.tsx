import {
  ComponentType,
  FC,
  lazy,
  LazyExoticComponent,
  Suspense,
  useEffect
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Route, Switch, useLocation, useRoute } from "wouter";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import * as Sentry from "@sentry/react";
import Loader from "../components/statics/loader";
import ErrorBoundaryFallback from "../components/statics/errorboundary";
import { OAUTH2_REDIRECT_PATH } from "../utils/constants";
import { trackPageview } from "../utils/analytics";

const LazyLoad = (
  Component: LazyExoticComponent<ComponentType>,
  componentName?: string
) => (
  <ErrorBoundary
    FallbackComponent={(props) => (
      <ErrorBoundaryFallback {...props} componentName={componentName} />
    )}
    onError={(error, errorInfo) => {
      if (import.meta.env.MODE === "development") {
        console.error(`Error in ${componentName}:`, error, errorInfo);
      }
      if (import.meta.env.VITE_SYSTEM_ENVIRONMENT === "production") {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
              componentName: componentName || "Unknown"
            }
          }
        });
      }
    }}
  >
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// ":id" is the publisher's link token — map.tsx passes the same value to
// configureHeader() as a credential. Pageviews report this pattern rather than
// the resolved path so the token never reaches analytics.
const MAP_ROUTE = "/map/:id";

const Map = lazy(() => import("./map"));
const FrontPage = lazy(() => import("./frontpage"));
const SignupPage = lazy(() => import("./signup"));
const ForgotPage = lazy(() => import("./forgot"));
const UserManagement = lazy(() => import("./usrmgmt"));
const OAuthCallback = lazy(() => import("./oauthcallback"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));

const Router: FC = () => {
  const [location] = useLocation();
  // wouter's matcher rather than a prefix test, so "/maps/abc" cannot match.
  const [isMapRoute] = useRoute(MAP_ROUTE);

  // Auto-pageview is disabled on the tracker, so pageviews are reported here.
  // "/" is skipped: FrontPage serves the login, verification and admin screens
  // from that one URL and reports whichever is showing itself.
  useEffect(() => {
    if (location === "/") return;
    trackPageview(isMapRoute ? MAP_ROUTE : location);
  }, [location, isMapRoute]);

  return (
    <>
      <ErrorBoundary
        FallbackComponent={ErrorBoundaryFallback}
        onError={(error, errorInfo) => {
          if (import.meta.env.MODE === "development") {
            console.error("Router-level error:", error, errorInfo);
          }
          if (import.meta.env.VITE_SYSTEM_ENVIRONMENT === "production") {
            Sentry.captureException(error, {
              contexts: {
                react: {
                  componentStack: errorInfo.componentStack,
                  level: "router"
                }
              }
            });
          }
        }}
      >
        <AnimatePresence mode="wait">
          <m.div
            key={location}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Switch>
              <Route path="/">{LazyLoad(FrontPage, "FrontPage")}</Route>
              <Route path="/signup">{LazyLoad(SignupPage, "Signup")}</Route>
              <Route path="/forgot">{LazyLoad(ForgotPage, "Forgot")}</Route>
              <Route path={MAP_ROUTE}>{LazyLoad(Map, "Map")}</Route>
              <Route path="/usermgmt">
                {LazyLoad(UserManagement, "UserManagement")}
              </Route>
              <Route path={OAUTH2_REDIRECT_PATH}>
                {LazyLoad(OAuthCallback, "OAuthCallback")}
              </Route>
              <Route path="*">{LazyLoad(NotFoundPage, "NotFound")}</Route>
            </Switch>
          </m.div>
        </AnimatePresence>
      </ErrorBoundary>
    </>
  );
};

export default Router;
