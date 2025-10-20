import { StylesConfig, GroupBase } from "react-select";

interface ReactSelectStylesOptions {
  isDark: boolean;
  zIndex?: number;
}

const getCSSVar = (name: string): string => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

const getColors = (isDark: boolean) => ({
  background: isDark ? getCSSVar("--mm-gray-100") : getCSSVar("--mm-white"),
  text: isDark ? getCSSVar("--mm-text-body") : getCSSVar("--mm-text-body"),
  border: isDark ? getCSSVar("--mm-border-color") : getCSSVar("--mm-gray-100"),
  borderHover: isDark
    ? getCSSVar("--mm-gray-600")
    : getCSSVar("--mm-primary-light"),
  optionFocused: isDark
    ? getCSSVar("--mm-gray-800")
    : getCSSVar("--mm-primary-lighter"),
  optionActive: isDark ? getCSSVar("--mm-gray-50") : getCSSVar("--mm-primary"),
  placeholder: getCSSVar("--mm-text-muted"),
  dangerHover: getCSSVar("--mm-danger")
});

export const getReactSelectStyles = <
  Option = unknown,
  IsMulti extends boolean = false
>({
  isDark,
  zIndex
}: ReactSelectStylesOptions): StylesConfig<
  Option,
  IsMulti,
  GroupBase<Option>
> => {
  const colors = getColors(isDark);

  return {
    menu: (provided) => ({
      ...provided,
      ...(zIndex && { zIndex }),
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`
    }),
    control: (base) => ({
      ...base,
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.text,
      "&:hover": {
        borderColor: colors.borderHover
      }
    }),
    menuList: (base) => ({
      ...base,
      backgroundColor: colors.background
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? colors.optionFocused
        : colors.background,
      color: colors.text,
      "&:active": {
        backgroundColor: colors.optionActive
      }
    }),
    input: (base) => ({
      ...base,
      color: colors.text
    }),
    singleValue: (base) => ({
      ...base,
      color: colors.text
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: colors.optionFocused
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: colors.text
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: colors.text,
      "&:hover": {
        backgroundColor: colors.dangerHover,
        color: getCSSVar("--mm-white")
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: colors.placeholder
    })
  };
};
