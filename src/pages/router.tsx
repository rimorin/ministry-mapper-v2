import { ComponentType, FC, lazy, LazyExoticComponent, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Route, Switch } from "wouter";
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
    <Suspense fallback={<Loader suspended />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

const Map = lazy(() => import("./map"));
const FrontPage = lazy(() => import("./frontpage"));
const UserManagement = lazy(() => import("./usrmgmt"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));

const Router: FC = () => (
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
    <Switch>
      <Route path="/">{LazyLoad(FrontPage, "FrontPage")}</Route>
      <Route path="/map/:id">{LazyLoad(Map, "Map")}</Route>
      <Route path="/usermgmt">
        {LazyLoad(UserManagement, "UserManagement")}
      </Route>
      <Route path="*">{LazyLoad(NotFoundPage, "NotFound")}</Route>
    </Switch>
  </ErrorBoundary>
);

export default Router;
