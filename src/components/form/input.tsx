// import { FormControl, FormHelperText, FormLabel, Input } from "@mui/joy";
import { FormControl, FormLabel, Input, FormHelperText } from "@mui/material";
import { FormProps } from "../../utils/interface";

const GenericInputField = ({
  handleChange,
  changeValue,
  name,
  label,
  required = false,
  placeholder = "",
  information = "",
  inputType = "string",
  readOnly = false,
  focus = false
}: FormProps) => {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input
        type={inputType}
        onChange={handleChange}
        name={name}
        value={changeValue}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        // autofocus does not work for ios safari
        autoFocus={focus}
      />
      {information && <FormHelperText>{information}</FormHelperText>}
    </FormControl>
  );
};

export default GenericInputField;
