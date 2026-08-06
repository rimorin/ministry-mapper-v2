import { useModal } from "@ebay/nice-modal-react";

type DialogSize = "default" | "lg" | "xl" | "fullscreen";

type UseBaseUiDialogOptions = {
  size?: DialogSize;
  staticBackdrop?: boolean;
  // Called whenever the dialog closes (backdrop click, Cancel, or programmatic
  // hide) — use it for form.reset()/state cleanup instead of overriding onOpenChange.
  onClose?: () => void;
};

const sizeClasses: Record<DialogSize, string> = {
  default: "sm:max-w-[425px]",
  lg: "sm:max-w-[700px]",
  xl: "sm:max-w-[1140px]",
  fullscreen: "p-0 gap-0"
};

export function useBaseUiDialog(options: UseBaseUiDialogOptions = {}) {
  const { size = "default", staticBackdrop = false, onClose } = options;
  const modal = useModal();

  const dialogProps = {
    open: modal.visible,
    onOpenChange: (open: boolean) => {
      if (!open) {
        onClose?.();
        if (!staticBackdrop) {
          modal.hide();
        }
      }
    },
    // Remove from the NiceModal registry once the exit animation finishes so
    // state doesn't persist on reopen.
    onOpenChangeComplete: (open: boolean) => {
      if (!open) modal.remove();
    }
  };

  const contentProps = {
    className: sizeClasses[size],
    fullscreen: size === "fullscreen",
    ...(staticBackdrop && {
      showCloseButton: false
    })
  };

  return { modal, hide: modal.hide, dialogProps, contentProps };
}
