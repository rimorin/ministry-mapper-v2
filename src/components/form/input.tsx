import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FormProps } from "../../utils/interface";

const GenericInputField = ({
  handleChange,
  handleClick,
  changeValue,
  name,
  label,
  required = false,
  placeholder = "",
  information = "",
  inputType = "text",
  readOnly = false,
  focus = false,
  autoComplete
}: FormProps) => {
  const inputId = `basicForm${name}Text`;

  return (
    <div className={cn("flex flex-col gap-1.5")}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type={inputType}
        onChange={handleChange}
        onClick={handleClick}
        name={name}
        value={changeValue}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={focus}
        autoComplete={autoComplete}
      />
      {information && (
        <p className="text-xs text-muted-foreground">{information}</p>
      )}
    </div>
  );
};

export default GenericInputField;
