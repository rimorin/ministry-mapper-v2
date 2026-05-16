import { NOT_HOME_STATUS_CODES } from "../../utils/constants";
import { FormProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const HHNotHomeField = ({ handleGroupChange, changeValue }: FormProps) => {
  const { t } = useTranslation();
  const options = [
    {
      value: NOT_HOME_STATUS_CODES.DEFAULT,
      label: t("household.firstTry", "1st")
    },
    {
      value: NOT_HOME_STATUS_CODES.SECOND_TRY,
      label: t("household.secondTry", "2nd")
    },
    {
      value: NOT_HOME_STATUS_CODES.THIRD_TRY,
      label: t("household.thirdTry", "3rd")
    },
    {
      value: NOT_HOME_STATUS_CODES.FOURTH_TRY,
      label: t("household.fourthTry", "4th")
    }
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{t("household.numberOfTries", "Number of tries")}</Label>
      <ToggleGroup
        aria-label="Not home reason"
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
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="flex-1"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default HHNotHomeField;
