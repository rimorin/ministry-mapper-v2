import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialogProps } from "../../utils/interface";

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    btnVariant: "destructive" as const
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    btnVariant: "default" as const
  },
  primary: {
    icon: Info,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
    btnVariant: "default" as const
  },
  secondary: {
    icon: CheckCircle,
    iconClass: "text-muted-foreground",
    bgClass: "bg-muted",
    btnVariant: "outline" as const
  }
};

const ConfirmDialog = NiceModal.create(
  ({
    title,
    message,
    confirmText,
    cancelText,
    variant = "danger",
    focusConfirm = false
  }: ConfirmDialogProps) => {
    const { t } = useTranslation();
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      staticBackdrop: true
    });

    const handleConfirm = () => {
      modal.resolve(true);
      modal.hide();
    };

    const handleCancel = () => {
      modal.resolve(false);
      modal.hide();
    };

    const config = variantConfig[variant] ?? variantConfig.danger;
    const Icon = config.icon;

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          className={cn(
            contentProps.className,
            "max-w-sm gap-0 p-0 overflow-hidden"
          )}
          aria-describedby="confirm-dialog-message"
        >
          {/* Icon + Title header */}
          <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-4 text-center">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full",
                config.bgClass,
                variant === "danger" &&
                  "animate-[shake_0.4s_ease-out_0.1s_both] motion-reduce:animate-none"
              )}
            >
              <Icon
                className={cn("size-6", config.iconClass)}
                strokeWidth={2}
              />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">{title}</h2>
              <p
                id="confirm-dialog-message"
                className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="grid grid-cols-2 gap-2 border-t px-4 py-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              autoFocus={!focusConfirm}
              className="w-full"
            >
              {cancelText || t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant={config.btnVariant}
              onClick={handleConfirm}
              autoFocus={focusConfirm}
              className="w-full"
            >
              {confirmText || t("common.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default ConfirmDialog;
