import { Form } from "react-bootstrap";
import { FormProps } from "../../utils/interface";
import { FormControl, FormLabel, Textarea } from "@mui/joy";

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
      {/* <Form.Group className="mb-3" controlId={`formBasic${name}TextAreaField`}>
      {label && <Form.Label>{label}</Form.Label>} */}
      {/* <Form.Control
        onChange={handleChange}
        name={name}
        as="textarea"
        rows={rows}
        placeholder={placeholder}
        value={changeValue}
        required={required}
        readOnly={readOnly}
      /> */}
      <Textarea
        onChange={handleChange}
        name={name}
        minRows={rows}
        maxRows={rows}
        placeholder={placeholder}
        value={changeValue}
        required={required}
        readOnly={readOnly}
      />
    </FormControl>
  );
};

export default GenericTextAreaField;
