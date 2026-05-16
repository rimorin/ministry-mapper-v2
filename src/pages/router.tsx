import { ComponentType, FC, lazy, LazyExoticComponent, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import * as Sentry from "@sentry/react";
import Loader from "../components/statics/loader";
import ErrorBoundaryFallback from "../components/statics/errorboundary";

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

const Map = lazy(() => import("./map"));
const FrontPage = lazy(() => import("./frontpage"));
const SignupPage = lazy(() => import("./signup"));
const ForgotPage = lazy(() => import("./forgot"));
const UserManagement = lazy(() => import("./usrmgmt"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));

const Router: FC = () => {
  const [location] = useLocation();
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
              <Route path="/map/:id">{LazyLoad(Map, "Map")}</Route>
              <Route path="/usermgmt">
                {LazyLoad(UserManagement, "UserManagement")}
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
