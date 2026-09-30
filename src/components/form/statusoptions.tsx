import { useTranslation } from "react-i18next";
import { Ban, Check, Circle, X } from "lucide-react";
import { STATUS_CODES } from "../../utils/constants";
import NotHomeIcon from "../table/nothome";

// Idle tiles recede and pressed ones come forward.
export const STATUS_TILE_CLASS =
  "flex-1 flex-col gap-1 h-auto py-2.5 opacity-40 transition-[opacity,transform,background-color,box-shadow] duration-150 ease-in-out motion-reduce:transition-none active:scale-95 data-[pressed]:opacity-100 data-[pressed]:z-10 data-[pressed]:ring-1 data-[pressed]:ring-inset focus:outline-none";

// Pressed tiles tint with the status's own hue instead of the theme primary,
// which can clash with the fixed symbol colors.
export const useStatusOptions = (nhcount?: string) => {
  const { t } = useTranslation();
  return [
    {
      value: STATUS_CODES.DEFAULT,
      label: t("address.notDone", "Not Done"),
      icon: <Circle className="size-5 text-muted-foreground" />,
      pressedClass: "data-[pressed]:ring-muted-foreground/40"
    },
    {
      value: STATUS_CODES.DONE,
      label: t("address.done", "Done"),
      icon: <Check className="size-5 text-status-done stroke-[3]" />,
      pressedClass:
        "data-[pressed]:bg-status-done/20 data-[pressed]:ring-status-done/50"
    },
    {
      value: STATUS_CODES.NOT_HOME,
      label: t("address.notHome", "Not Home"),
      icon: <NotHomeIcon nhcount={nhcount} iconClassName="size-5" />,
      pressedClass:
        "data-[pressed]:bg-status-nothome/20 data-[pressed]:ring-status-nothome/50"
    },
    {
      value: STATUS_CODES.DO_NOT_CALL,
      label: t("address.dnc", "DNC"),
      icon: <Ban className="size-5 text-status-dnc stroke-[3]" />,
      pressedClass:
        "data-[pressed]:bg-status-dnc/20 data-[pressed]:ring-status-dnc/50"
    },
    {
      value: STATUS_CODES.INVALID,
      label: t("address.invalid", "Invalid"),
      icon: <X className="size-5 text-status-invalid stroke-[3]" />,
      pressedClass:
        "data-[pressed]:bg-status-invalid/20 data-[pressed]:ring-status-invalid/50"
    }
  ];
};
