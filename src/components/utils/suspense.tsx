import { ReactNode, Suspense } from "react";
import Loader from "../statics/loader";

const SuspenseComponent = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: ReactNode = <Loader />
) => {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );

  return WrappedComponent;
};

export default SuspenseComponent;
