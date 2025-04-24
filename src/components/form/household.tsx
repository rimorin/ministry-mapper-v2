import { HouseholdProps } from "../../utils/interface";
import Select from "react-select";
import { useTranslation } from "react-i18next";

const HouseholdField = ({
  handleChange,
  changeValue,
  options
}: HouseholdProps) => {
  const { t } = useTranslation();

  return (
    <div className="mb-3">
      <div className="mb-2 inline-block">
        {t("household.household", "Household")}
      </div>
      <Select
        options={options}
        onChange={handleChange}
        defaultValue={changeValue?.map((value) => {
          return options.find((option) => option.value === value.id);
        })}
        isMulti={true}
        required
        placeholder={t("household.select", "Select household type...")}
        noOptionsMessage={() =>
          t("household.noOptions", "No options available")
        }
      />
    </div>
  );
};

export default HouseholdField;
