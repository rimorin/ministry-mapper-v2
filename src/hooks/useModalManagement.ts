/* eslint-disable @typescript-eslint/no-explicit-any */
import ModalManager from "@ebay/nice-modal-react";
import SuspenseComponent from "../components/utils/suspense";

type AnyModalComponent =
  | React.LazyExoticComponent<React.ComponentType<any>>
  | React.ComponentType<any>;

export function useModalManagement() {
  const showModal = (ModalComponent: AnyModalComponent, props: any) => {
    const isLazyComponent =
      typeof ModalComponent === "object" &&
      ModalComponent !== null &&
      (ModalComponent as { $$typeof?: symbol }).$$typeof ===
        Symbol.for("react.lazy");

    return ModalManager.show(
      (isLazyComponent
        ? SuspenseComponent(
            ModalComponent as React.LazyExoticComponent<
              React.ComponentType<any>
            >
          )
        : ModalComponent) as React.FC<any>,
      props
    );
  };

  const hideModal = (id: string) => {
    return ModalManager.hide(id);
  };

  return { showModal, hideModal };
}
