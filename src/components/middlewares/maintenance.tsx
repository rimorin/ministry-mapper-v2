import { FC, ReactNode, lazy, Suspense } from "react";
import Loader from "../statics/loader";
const MaintenanceMode = lazy(() => import("../statics/maintenance"));

interface MaintenanceMiddlewareProps {
  children: ReactNode;
}

const MaintenanceMiddleware: FC<MaintenanceMiddlewareProps> = ({
  children
}) => {
  const activateMaintenanceMode =
    import.meta.env.VITE_MAINTENANCE_MODE === "true";

  if (activateMaintenanceMode)
    return (
      <Suspense fallback={<Loader suspended />}>
        <MaintenanceMode />
      </Suspense>
    );

  return <>{children}</>;
};

export default MaintenanceMiddleware;
