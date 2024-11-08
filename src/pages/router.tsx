import { createBrowserRouter } from "react-router-dom";
import { ComponentType, lazy, LazyExoticComponent, Suspense } from "react";
import Loader from "../components/statics/loader";

const LazyLoad = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<Loader suspended />}>
    <Component />
  </Suspense>
);

const Map = lazy(() => import("./map"));
const FrontPage = lazy(() => import("./frontpage"));
const UserManagement = lazy(() => import("./usrmgmt"));
const NotFoundPage = lazy(() => import("../components/statics/notfound"));
const ErrorPage = lazy(() => import("../components/statics/error"));

const router = createBrowserRouter([
  {
    path: "/",
    element: LazyLoad(FrontPage),
    errorElement: LazyLoad(ErrorPage)
  },
  {
    path: "/map/:id",
    element: LazyLoad(Map),
    errorElement: LazyLoad(ErrorPage)
  },
  {
    path: "/usermgmt",
    element: LazyLoad(UserManagement),
    errorElement: LazyLoad(ErrorPage)
  },
  {
    path: "*",
    element: LazyLoad(NotFoundPage)
  }
]);

export default router;
