import {
  FC,
  ReactNode,
  lazy,
  Suspense,
  useState,
  useEffect,
  useTransition
} from "react";
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
  const [isPending, startTransition] = useTransition();

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
        startTransition(() => {
          setHealthState(response.ok ? "online" : "offline");
        });
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

  if (healthState === "checking" || isPending) return <Loader />;

  if (healthState === "offline")
    return (
      <Suspense fallback={<Loader />}>
        <BackendOffline onRetry={handleRetry} />
      </Suspense>
    );

  return <>{children}</>;
};

export default BackendHealthMiddleware;
