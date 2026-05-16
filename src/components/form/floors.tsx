import type { ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { MIN_START_FLOOR, MAX_TOP_FLOOR } from "../../utils/constants";
import type { FloorProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const suffixes = ["th", "st", "nd", "rd"];

const FloorField = ({ handleChange, changeValue }: FloorProps) => {
  const { t } = useTranslation();

  const getOrdinalNumber = (n: number): string => {
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="formBasicFloorRange">
        {t("floors.numberOfFloors", "No. of floors")}
      </Label>
      <div className="flex items-center gap-3">
        <input
          id="formBasicFloorRange"
          type="range"
          min={MIN_START_FLOOR}
          max={MAX_TOP_FLOOR}
          value={changeValue}
          onChange={(e) =>
            handleChange?.(e as unknown as ChangeEvent<HTMLElement>)
          }
          className="flex-1 h-1.5 cursor-pointer accent-primary"
          aria-label={t("floors.numberOfFloors", "No. of floors")}
        />
        <span className="min-w-[3rem] text-right text-sm tabular-nums text-muted-foreground">
          {getOrdinalNumber(changeValue)}
        </span>
      </div>
    </div>
  );
};

export default FloorField;
