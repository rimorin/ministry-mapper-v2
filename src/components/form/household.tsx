import { Option, Select } from "@mui/joy";
import {
  DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE,
  DEFAULT_MULTPLE_OPTION_DELIMITER
} from "../../utils/constants";
import { HouseholdProps, SelectProps } from "../../utils/interface";
// import Select from "react-select";

const HouseholdField = ({
  handleChange,
  changeValue,
  options,
  isMultiselect
}: HouseholdProps) => {
  const handleSelectedOptions = (
    changeValue = "",
    isMultiselect = DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE
  ) => {
    if (isMultiselect) {
      return [
        isMultiselect,
        changeValue?.split(DEFAULT_MULTPLE_OPTION_DELIMITER)
      ];
    }
    const hasExistingMultipleValues = changeValue?.includes(
      DEFAULT_MULTPLE_OPTION_DELIMITER
    );
    if (hasExistingMultipleValues) {
      // if there are existing multiple values after switching from multiselect to single select, clear the value in the dropdown
      return [isMultiselect, []];
    }

    return [isMultiselect, changeValue];
  };

  const [isMultiselectValue, selectedOptions] = handleSelectedOptions(
    changeValue,
    isMultiselect
  );
  console.log(`isMultiselectValue: ${isMultiselectValue}`);
  console.log(selectedOptions);

  return (
    <div className="mb-3">
      <div className="mb-2 inline-block">Household</div>
      <Select
        // options={options}
        // onChange={handleChange}
        // defaultValue={selectedOptions}
        // isSearchable={false}
        // isMulti={isMultiselectValue as boolean}
        // required
        required
        multiple={isMultiselectValue as boolean}
        onChange={handleChange}
        defaultValue={selectedOptions as string | string[]}
        // renderValue={(selected) => (
        //   <Box sx={{ display: "flex", gap: "0.25rem" }}>
        //     {selected.map((selectedOption) => (
        //       <Chip key={selectedOption.value} variant="soft" color="primary">
        //         {selectedOption.label}
        //       </Chip>
        //     ))}
        //   </Box>
        // )}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default HouseholdField;
