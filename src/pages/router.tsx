import { ComponentType, FC, lazy, LazyExoticComponent, Suspense } from "react";
import Loader from "../components/statics/loader";
import { Route, Switch } from "wouter";

const LazyLoad = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<Loader suspended />}>
    <Component />
  </Suspense>
);

const Map = lazy(() => import("./map"));
const FrontPage = lazy(() => import("./frontpage"));
const UserManagement = lazy(() => import("./usrmgmt"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));

const Router: FC = () => (
  <Switch>
    <Route path="/">{LazyLoad(FrontPage)}</Route>
    <Route path="/map/:id">{LazyLoad(Map)}</Route>
    <Route path="/usermgmt">{LazyLoad(UserManagement)}</Route>
    <Route path="*">{LazyLoad(NotFoundPage)}</Route>
  </Switch>
);

export default Router;
