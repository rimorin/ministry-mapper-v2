import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FormProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { CalendarIcon } from "lucide-react";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const DncDateField = ({ handleDateChange, changeDate }: FormProps) => {
  const { t } = useTranslation();
  const today = new Date();

  const existingDate = changeDate ? new Date(changeDate) : null;
  const isExistingPast = existingDate && !isSameDay(existingDate, today);

  const [chip, setChip] = useState<"today" | "custom">(
    isExistingPast ? "custom" : "today"
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(
    isExistingPast ? existingDate : undefined
  );

  const resolvedDate = chip === "today" ? today : customDate;

  const formatted = resolvedDate?.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const handleChipChange = (value: string[]) => {
    const selected = value[0] as "today" | "custom" | undefined;
    if (!selected) return;
    if (selected === "today") {
      setChip("today");
      handleDateChange?.(today);
    } else {
      setChip("custom");
      if (!customDate) setCalendarOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("address.dncDate", "Date of DNC")}</Label>
      <ToggleGroup
        variant="outline"
        className="w-full"
        value={[chip]}
        onValueChange={handleChipChange}
      >
        <ToggleGroupItem value="today" className="flex-1">
          {t("address.dncToday", "Today")}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="custom"
          className="flex-1"
          onClick={() => chip === "custom" && setCalendarOpen(true)}
        >
          <CalendarIcon className="mr-1.5 size-4" />
          {t("address.dncCustom", "Custom")}
        </ToggleGroupItem>
      </ToggleGroup>

      {chip === "today" && formatted && (
        <p className="text-xs text-muted-foreground pl-1">{formatted}</p>
      )}

      {chip === "custom" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-start font-normal"
              />
            }
          >
            <CalendarIcon className="mr-2 size-4 opacity-50" />
            {customDate ? formatted : t("address.dncPickDate", "Pick a date")}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customDate}
              disabled={{ after: today }}
              defaultMonth={customDate ?? today}
              onSelect={(date) => {
                if (date) {
                  setCustomDate(date);
                  handleDateChange?.(date);
                  setCalendarOpen(false);
                }
              }}
              className="[--cell-size:--spacing(10)]"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DncDateField;
