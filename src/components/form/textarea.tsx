import { FormControl, FormLabel, TextField } from "@mui/material";
import { FormProps } from "../../utils/interface";
// import { FormControl, FormLabel, Textarea } from "@mui/joy";

const GenericTextAreaField = ({
  handleChange,
  changeValue,
  label,
  name,
  placeholder,
  rows = 3,
  required = false,
  readOnly = false
}: FormProps) => {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <TextField
        multiline
        onChange={handleChange}
        name={name}
        minRows={rows}
        maxRows={rows}
        placeholder={placeholder}
        value={changeValue}
        required={required}
        // readOnly={readOnly}
        sx={
          readOnly
            ? {
                backgroundColor: "background.default",
                color: "text.primary",
                cursor: "not-allowed"
              }
            : {}
        }
      />
    </FormControl>
  );
};

export default GenericTextAreaField;
