import { FC, ReactNode, lazy, Suspense } from "react";
import { useFlags } from "launchdarkly-react-client-sdk";
import Loader from "../statics/loader";
const MaintenanceMode = lazy(() => import("../statics/maintenance"));

interface MaintenanceMiddlewareProps {
  children: ReactNode;
}

const MaintenanceMiddleware: FC<MaintenanceMiddlewareProps> = ({
  children
}) => {
  // LD flag key "maintenance-mode" is exposed camelCased. Without an LD
  // provider, useFlags() returns {} so this is undefined (off).
  const { maintenanceMode } = useFlags();
  const activateMaintenanceMode =
    import.meta.env.VITE_MAINTENANCE_MODE === "true" ||
    maintenanceMode === true;

  if (activateMaintenanceMode)
    return (
      <Suspense fallback={<Loader />}>
        <MaintenanceMode />
      </Suspense>
    );

  return <>{children}</>;
};

export default MaintenanceMiddleware;
