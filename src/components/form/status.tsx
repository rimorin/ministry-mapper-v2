import * as m from "motion/react-m";
import type { FormProps } from "../../utils/interface";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { STATUS_TILE_CLASS, useStatusOptions } from "./statusoptions";

interface HHStatusFieldProps extends FormProps {
  nhcount?: string;
}

const HHStatusField = ({
  handleGroupChange,
  changeValue,
  nhcount
}: HHStatusFieldProps) => {
  const options = useStatusOptions(nhcount);

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
            className={cn(STATUS_TILE_CLASS, pressedClass)}
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
