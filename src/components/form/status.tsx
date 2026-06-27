import * as m from "motion/react-m";
import { useTranslation } from "react-i18next";
import { STATUS_CODES } from "../../utils/constants";
import type { FormProps } from "../../utils/interface";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ban, Check, Circle, X } from "lucide-react";
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
  const options = [
    {
      value: STATUS_CODES.DEFAULT,
      label: t("address.notDone", "Not Done"),
      icon: <Circle className="size-5 text-muted-foreground" />
    },
    {
      value: STATUS_CODES.DONE,
      label: t("address.done", "Done"),
      icon: (
        <Check className="size-5 text-green-500 dark:text-green-400 stroke-[3]" />
      )
    },
    {
      value: STATUS_CODES.NOT_HOME,
      label: t("address.notHome", "Not Home"),
      icon: <NotHomeIcon nhcount={nhcount} iconClassName="size-5" />
    },
    {
      value: STATUS_CODES.DO_NOT_CALL,
      label: t("address.dnc", "DNC"),
      icon: <Ban className="size-5 text-red-500 dark:text-red-400 stroke-[3]" />
    },
    {
      value: STATUS_CODES.INVALID,
      label: t("address.invalid", "Invalid"),
      icon: (
        <X className="size-5 text-violet-500 dark:text-violet-400 stroke-[3]" />
      )
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
        {options.map(({ value, label, icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            className="flex-1 flex-col gap-1 h-auto py-2.5 opacity-40 transition-[opacity,transform,background-color] duration-150 ease-in-out motion-reduce:transition-none active:scale-95 data-[pressed]:opacity-100 data-[pressed]:bg-primary/75 data-[pressed]:text-primary-foreground data-[pressed]:z-10 focus:outline-none"
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
