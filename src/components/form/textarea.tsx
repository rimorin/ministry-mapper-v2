import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FormProps } from "../../utils/interface";
import { X } from "lucide-react";

const GenericTextAreaField = ({
  handleChange,
  changeValue,
  name,
  label,
  required = false,
  placeholder = "",
  readOnly = false,
  information,
  onClear,
  textareaClassName
}: FormProps) => {
  const inputId = `formBasic${name}TextAreaField`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={inputId}>{label}</Label>
          {onClear && changeValue && (
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              aria-label="Clear"
              onClick={onClear}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      )}
      <Textarea
        id={inputId}
        onChange={handleChange}
        name={name}
        value={changeValue as string}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        className={textareaClassName}
      />
      {information && (
        <p className="text-sm text-muted-foreground">{information}</p>
      )}
    </div>
  );
};

export default GenericTextAreaField;
