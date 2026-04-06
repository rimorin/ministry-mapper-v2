/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, Suspense } from "react";
import Loader from "../statics/loader";

const SuspenseComponent = (
  Component: React.LazyExoticComponent<any>,
  fallback: ReactNode = <Loader />
) => {
  return (props: any) => {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
};

export default SuspenseComponent;
