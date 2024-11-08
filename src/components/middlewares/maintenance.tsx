import { FC, ReactNode, lazy, Suspense } from "react";
import Loader from "../statics/loader";
const MaintenanceMode = lazy(() => import("../statics/maintenance"));
import { useFlags, withLDConsumer } from "launchdarkly-react-client-sdk";
interface MaintenanceMiddlewareProps {
  children: ReactNode;
}

const MaintenanceMiddleware: FC<MaintenanceMiddlewareProps> = ({
  children
}) => {
  const { activateMaintenanceMode } = useFlags();
  if (activateMaintenanceMode)
    return (
      <Suspense fallback={<Loader />}>
        <MaintenanceMode />
      </Suspense>
    );

  return <>{children}</>;
};

export default withLDConsumer()(MaintenanceMiddleware);
