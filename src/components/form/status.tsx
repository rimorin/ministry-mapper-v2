import * as m from "motion/react-m";
import { useTranslation } from "react-i18next";
import { STATUS_CODES } from "../../utils/constants";
import type { FormProps } from "../../utils/interface";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ban, Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import NotHomeIcon from "../table/nothome";

interface HHStatusFieldProps extends FormProps {
  nhcount?: string;
}

const HHStatusField = ({
  handleGroupChange,
  changeValue,
  nhcount
}: HHStatusFieldProps) => {
  const { t } = useTranslation();
  // Pressed tiles tint with the status's own hue instead of the theme
  // primary, which can clash with the fixed symbol colors.
  const options = [
    {
      value: STATUS_CODES.DEFAULT,
      label: t("address.notDone", "Not Done"),
      icon: <Circle className="size-5 text-muted-foreground" />,
      pressedClass: "data-[pressed]:ring-muted-foreground/40"
    },
    {
      value: STATUS_CODES.DONE,
      label: t("address.done", "Done"),
      icon: (
        <Check className="size-5 text-green-500 dark:text-green-400 stroke-[3]" />
      ),
      pressedClass:
        "data-[pressed]:bg-green-500/20 data-[pressed]:ring-green-500/50"
    },
    {
      value: STATUS_CODES.NOT_HOME,
      label: t("address.notHome", "Not Home"),
      icon: <NotHomeIcon nhcount={nhcount} iconClassName="size-5" />,
      pressedClass:
        "data-[pressed]:bg-orange-500/20 data-[pressed]:ring-orange-500/50"
    },
    {
      value: STATUS_CODES.DO_NOT_CALL,
      label: t("address.dnc", "DNC"),
      icon: (
        <Ban className="size-5 text-red-500 dark:text-red-400 stroke-[3]" />
      ),
      pressedClass:
        "data-[pressed]:bg-red-500/20 data-[pressed]:ring-red-500/50"
    },
    {
      value: STATUS_CODES.INVALID,
      label: t("address.invalid", "Invalid"),
      icon: (
        <X className="size-5 text-violet-500 dark:text-violet-400 stroke-[3]" />
      ),
      pressedClass:
        "data-[pressed]:bg-violet-500/20 data-[pressed]:ring-violet-500/50"
    }
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <ToggleGroup
        aria-label="Select status"
        variant="outline"
        value={changeValue ? [changeValue] : []}
        onValueChange={(values) => {
          const value = values[values.length - 1];
          if (value) {
            handleGroupChange?.(value);
          }
        }}
        className="flex w-full"
      >
        {options.map(({ value, label, icon, pressedClass }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            className={cn(
              "flex-1 flex-col gap-1 h-auto py-2.5 opacity-40 transition-[opacity,transform,background-color,box-shadow] duration-150 ease-in-out motion-reduce:transition-none active:scale-95 data-[pressed]:opacity-100 data-[pressed]:z-10 data-[pressed]:ring-1 data-[pressed]:ring-inset focus:outline-none",
              pressedClass
            )}
          >
            <m.span
              className="inline-flex"
              animate={{ scale: changeValue === value ? 1.15 : 1 }}
              transition={{ type: "spring", visualDuration: 0.25, bounce: 0.4 }}
            >
              {icon}
            </m.span>
            <span className="text-[10px] font-medium leading-none">
              {label}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default HHStatusField;
