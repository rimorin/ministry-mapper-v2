import { use } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../utils/context";
import { HouseholdProps, SelectProps } from "../../utils/interface";
import { getReactSelectStyles } from "../../utils/helpers/reactSelectStyles";

const HouseholdField = ({
  handleChange,
  changeValue,
  options
}: HouseholdProps) => {
  const { t } = useTranslation();
  const { actualTheme } = use(ThemeContext);

  const customStyles = getReactSelectStyles<SelectProps, true>({
    isDark: actualTheme === "dark"
  });

  const defaultValue = changeValue
    ?.map((value) => options.find((option) => option.value === value.id))
    .filter((option): option is SelectProps => option !== undefined);

  return (
    <div className="mb-3">
      <div className="mb-2 inline-block">
        {t("household.household", "Household")}
      </div>
      <Select<SelectProps, true>
        options={options}
        onChange={handleChange}
        defaultValue={defaultValue}
        isMulti
        required
        placeholder={t("household.select", "Select household type...")}
        noOptionsMessage={() =>
          t("household.noOptions", "No options available")
        }
        styles={customStyles}
      />
    </div>
  );
};

export default HouseholdField;
