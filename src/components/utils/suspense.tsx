import { Suspense, ComponentType } from "react";
import Loader from "../statics/loader";

const SuspenseComponent = <T extends object>(Component: ComponentType<T>) => {
  return (props: T) => {
    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

export default SuspenseComponent;
