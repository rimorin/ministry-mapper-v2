import { useModal } from "@ebay/nice-modal-react";

type DialogSize = "default" | "lg" | "xl" | "fullscreen";

type UseBaseUiDialogOptions = {
  size?: DialogSize;
  staticBackdrop?: boolean;
};

const sizeClasses: Record<DialogSize, string> = {
  default: "sm:max-w-[425px]",
  lg: "sm:max-w-[700px]",
  xl: "sm:max-w-[1140px]",
  fullscreen: "p-0 gap-0"
};

export function useBaseUiDialog(options: UseBaseUiDialogOptions = {}) {
  const { size = "default", staticBackdrop = false } = options;
  const modal = useModal();

  // Always remove from registry after hiding so state doesn't persist on reopen
  const hide = () => {
    modal.hide();
    setTimeout(() => modal.remove(), 300);
  };

  const dialogProps = {
    open: modal.visible,
    onOpenChange: (open: boolean) => {
      if (!open && !staticBackdrop) {
        hide();
      }
    }
  };

  const contentProps = {
    className: sizeClasses[size],
    fullscreen: size === "fullscreen",
    ...(staticBackdrop && {
      showCloseButton: false
    })
  };

  // Override modal.hide so callers that call modal.hide() directly
  // still get the remove() cleanup, not just hide().
  return { modal: { ...modal, hide }, hide, dialogProps, contentProps };
}
