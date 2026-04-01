import { FC, ReactNode, lazy, Suspense, useState, useEffect } from "react";
import Loader from "../statics/loader";
const BackendOffline = lazy(() => import("../statics/backendoffline"));

const HEALTH_ENDPOINT = `${import.meta.env.VITE_POCKETBASE_URL}/api/health`;
const FETCH_TIMEOUT = 10000;

type HealthState = "checking" | "online" | "offline";

interface BackendHealthMiddlewareProps {
  children: ReactNode;
}

const BackendHealthMiddleware: FC<BackendHealthMiddlewareProps> = ({
  children
}) => {
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const checkHealth = async () => {
      try {
        const response = await fetch(HEALTH_ENDPOINT, {
          method: "GET",
          cache: "no-cache",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        setHealthState(response.ok ? "online" : "offline");
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error).name !== "AbortError") {
          setHealthState("offline");
        }
      }
    };

    checkHealth();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [retryCount]);

  const handleRetry = () => {
    setHealthState("checking");
    setRetryCount((c) => c + 1);
  };

  if (healthState === "checking") return <Loader />;

  if (healthState === "offline")
    return (
      <Suspense fallback={<Loader suspended />}>
        <BackendOffline onRetry={handleRetry} />
      </Suspense>
    );

  return <>{children}</>;
};

export default BackendHealthMiddleware;
