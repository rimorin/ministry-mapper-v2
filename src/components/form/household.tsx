import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import type { HouseholdProps, SelectProps } from "../../utils/interface";

const HouseholdField = ({
  handleChange,
  changeValue,
  options,
  error
}: HouseholdProps & { error?: string }) => {
  const { t } = useTranslation();

  const selectedIds = changeValue?.map((v) => v.id) ?? [];

  const onValueChange = (values: string[]) => {
    const selected = values
      .map((id) => options.find((o) => o.value === id))
      .filter((o): o is SelectProps => o !== undefined);
    handleChange?.(selected);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{t("household.household", "Household")}</Label>
      <MultiSelect
        options={options}
        value={selectedIds}
        onChange={onValueChange}
        placeholder={t("household.select", "Select household type...")}
        noOptionsMessage={t("household.noOptions", "No options available")}
        label={t("household.household", "Household")}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default HouseholdField;
