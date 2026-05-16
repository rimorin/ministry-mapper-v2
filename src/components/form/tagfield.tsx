import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import useNotification from "../../hooks/useNotification";
import { PROPERTY_CODE_PATTERN } from "../../utils/helpers/processpropertyno";

interface TagFieldProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  formatCreateLabel?: (inputValue: string) => string;
  allowedPattern?: RegExp;
  helpText?: string;
}

const TagField = ({
  label,
  value,
  onChange,
  placeholder,
  allowedPattern = PROPERTY_CODE_PATTERN,
  helpText
}: TagFieldProps) => {
  const { notifyInfo } = useNotification();
  const { t } = useTranslation();
  const id = useId();
  const labelId = `tagfield-label-${id}`;
  const inputId = `tagfield-input-${id}`;
  const helpTextId = `tagfield-help-${id}`;

  const handleAttemptAdd = (raw: string): string | null => {
    const cleaned = raw.trim().replace(allowedPattern, "");

    if (cleaned.length === 0) {
      if (raw.trim().length > 0) notifyInfo(t("tagfield.invalidCharacters"));
      return null;
    }
    if (raw !== cleaned) {
      notifyInfo(t("tagfield.charactersSanitized", { value: cleaned }));
    }
    if (value.includes(cleaned)) {
      notifyInfo(t("tagfield.duplicatesRemoved"));
      return null;
    }
    return cleaned;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label id={labelId} htmlFor={inputId}>
        {label}
      </Label>
      <TagInput
        id={inputId}
        value={value}
        onChange={onChange}
        onAttemptAdd={handleAttemptAdd}
        placeholder={placeholder}
        aria-labelledby={labelId}
        aria-describedby={helpText ? helpTextId : undefined}
      />
      {helpText && (
        <p id={helpTextId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default TagField;
