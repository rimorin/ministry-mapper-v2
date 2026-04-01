import { FC, ReactNode, lazy, Suspense } from "react";
import Loader from "../statics/loader";
const PwaUnsupported = lazy(() => import("../statics/pwaunsupported"));

const isPwaMode = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

interface PwaMiddlewareProps {
  children: ReactNode;
}

const PwaMiddleware: FC<PwaMiddlewareProps> = ({ children }) => {
  if (isPwaMode())
    return (
      <Suspense fallback={<Loader suspended />}>
        <PwaUnsupported />
      </Suspense>
    );

  return <>{children}</>;
};

export default PwaMiddleware;
