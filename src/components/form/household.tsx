import { HouseholdProps } from "../../utils/interface";
import Select from "react-select";

const HouseholdField = ({
  handleChange,
  changeValue,
  options
}: HouseholdProps) => {
  return (
    <div className="mb-3">
      <div className="mb-2 inline-block">Household</div>
      <Select
        options={options}
        onChange={handleChange}
        defaultValue={changeValue?.map((value) => {
          return options.find((option) => option.value === value.id);
        })}
        isMulti={true}
        required
      />
    </div>
  );
};

export default HouseholdField;
