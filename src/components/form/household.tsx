import { useMemo } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { HouseholdProps, SelectProps } from "../../utils/interface";
import { getReactSelectStyles } from "../../utils/helpers/reactSelectStyles";

const HouseholdField = ({
  handleChange,
  changeValue,
  options
}: HouseholdProps) => {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();

  const customStyles = useMemo(
    () =>
      getReactSelectStyles<SelectProps, true>({
        isDark: actualTheme === "dark"
      }),
    [actualTheme]
  );

  const defaultValue = useMemo(
    () =>
      changeValue
        ?.map((value) => options.find((option) => option.value === value.id))
        .filter((option): option is SelectProps => option !== undefined),
    [changeValue, options]
  );

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
