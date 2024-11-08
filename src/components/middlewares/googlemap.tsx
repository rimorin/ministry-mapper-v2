import { FC, lazy, ReactNode, Suspense } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import Loader from "../statics/loader";

const MissingSetupPage = lazy(() => import("../statics/missingsetup"));
interface MapsMiddlewareProps {
  children: ReactNode;
}

const MapsMiddleware: FC<MapsMiddlewareProps> = ({ children }) => {
  const { VITE_GOOGLE_MAPS_API_KEY } = import.meta.env;
  if (!VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Suspense fallback={<Loader suspended />}>
        <MissingSetupPage message="Missing Google Maps API Key" />
      </Suspense>
    );
  }

  return (
    <APIProvider apiKey={VITE_GOOGLE_MAPS_API_KEY}>{children}</APIProvider>
  );
};

export default MapsMiddleware;
