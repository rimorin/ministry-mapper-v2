import { lazy } from "react";
import { useModalManagement } from "./useModalManagement";
import { ConfirmDialogProps } from "../utils/interface";

const ConfirmDialog = lazy(() => import("../components/modal/confirmdialog"));

export function useConfirm() {
  const { showModal } = useModalManagement();

  const confirm = async ({
    title,
    message,
    confirmText,
    cancelText,
    variant = "danger",
    focusConfirm = false
  }: ConfirmDialogProps): Promise<boolean> => {
    try {
      const result = await showModal(ConfirmDialog, {
        title,
        message,
        confirmText,
        cancelText,
        variant,
        focusConfirm
      });
      return result === true;
    } catch {
      return false;
    }
  };

  return { confirm };
}

export default useConfirm;
