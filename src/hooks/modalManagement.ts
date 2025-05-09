/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import ModalManager from "@ebay/nice-modal-react";
import SuspenseComponent from "../components/utils/suspense";

export default function modalManagement() {
  const showModal = useCallback(
    (
      ModalComponent: React.LazyExoticComponent<any> | React.FC<any>,
      props: any
    ) => {
      const isLazyComponent =
        typeof ModalComponent === "object" &&
        ModalComponent !== null &&
        (ModalComponent as any).$$typeof === Symbol.for("react.lazy");

      return ModalManager.show(
        isLazyComponent
          ? SuspenseComponent(ModalComponent as React.LazyExoticComponent<any>)
          : ModalComponent,
        props
      );
    },
    []
  );

  return { showModal };
}
