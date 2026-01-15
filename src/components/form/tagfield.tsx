import { use, useId } from "react";
import { Form } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../utils/context";
import { getReactSelectStyles } from "../../utils/helpers/reactSelectStyles";
import useNotification from "../../hooks/useNotification";

interface TagOption {
  value: string;
  label: string;
}

interface TagFieldProps {
  label: string;
  value: TagOption[];
  onChange: (newValue: readonly TagOption[] | null) => void;
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
  noOptionsMessage,
  formatCreateLabel,
  allowedPattern = /[^a-zA-Z0-9-]/g,
  helpText
}: TagFieldProps) => {
  const { actualTheme } = use(ThemeContext);
  const { notifyInfo } = useNotification();
  const { t } = useTranslation();
  const id = useId();
  const labelId = `tagfield-label-${id}`;
  const helpTextId = `tagfield-help-${id}`;

  const customStyles = getReactSelectStyles<TagOption, true>({
    isDark: actualTheme === "dark"
  });

  const handleChange = (newValue: readonly TagOption[] | null) => {
    if (!newValue) {
      onChange(null);
      return;
    }

    const lastTag = newValue[newValue.length - 1];
    const originalValue = lastTag?.value || "";
    const cleanValue = originalValue.trim().replace(allowedPattern, "");

    // Check if the new tag was modified during sanitization
    if (
      newValue.length > value.length &&
      originalValue !== cleanValue &&
      originalValue.length > 0
    ) {
      if (cleanValue.length === 0) {
        notifyInfo(t("tagfield.invalidCharacters"));
        return;
      }
      if (originalValue !== cleanValue) {
        notifyInfo(t("tagfield.charactersSanitized", { value: cleanValue }));
      }
    }

    const processedTags = newValue
      .map((tag) => {
        const processed = tag.value.trim().replace(allowedPattern, "");
        return { value: processed, label: processed };
      })
      .filter((tag) => tag.value);

    // Check for duplicates
    const uniqueTags = processedTags.filter(
      (tag, index, self) =>
        index === self.findIndex((t) => t.value === tag.value)
    );

    if (uniqueTags.length < processedTags.length) {
      notifyInfo(t("tagfield.duplicatesRemoved"));
    }

    onChange(uniqueTags);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  return (
    <Form.Group className="mb-3" onKeyDown={handleKeyDown}>
      <Form.Label id={labelId}>{label}</Form.Label>
      <CreatableSelect<TagOption, true>
        isMulti
        isClearable
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        noOptionsMessage={() => noOptionsMessage || ""}
        formatCreateLabel={formatCreateLabel}
        components={{
          DropdownIndicator: null
        }}
        styles={customStyles}
        aria-labelledby={labelId}
        aria-describedby={helpText ? helpTextId : undefined}
      />
      {helpText && (
        <Form.Text id={helpTextId} className="text-muted">
          {helpText}
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default TagField;
