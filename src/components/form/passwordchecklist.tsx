interface PasswordChecklistProps {
  password: string;
  passwordConfirm: string;
  minLength?: number;
  onChange?: (isValid: boolean) => void;
  messages?: {
    minLength?: string;
    number?: string;
    capital?: string;
    match?: string;
  };
}

interface ValidationRule {
  key: string;
  isValid: boolean;
  message: string;
}

const PasswordChecklist = ({
  password,
  passwordConfirm,
  minLength = 6,
  onChange,
  messages
}: PasswordChecklistProps) => {
  const validationRules: ValidationRule[] = [
    {
      key: "minLength",
      isValid: password.length >= minLength,
      message:
        messages?.minLength ||
        `Password must be at least ${minLength} characters long.`
    },
    {
      key: "number",
      isValid: /\d/.test(password),
      message: messages?.number || "Password must contain numbers."
    },
    {
      key: "capital",
      isValid: /[A-Z]/.test(password),
      message: messages?.capital || "Password must contain uppercase letters."
    },
    {
      key: "match",
      isValid: password === passwordConfirm && password.length > 0,
      message: messages?.match || "Passwords must match."
    }
  ];

  const allValid = validationRules.every((rule) => rule.isValid);
  if (onChange) {
    onChange(allValid);
  }

  return (
    <ul className="list-unstyled mb-0">
      {validationRules.map((rule) => (
        <li
          key={rule.key}
          className="d-flex align-items-start mb-1"
          style={{ fontSize: "0.8rem", lineHeight: "1.4" }}
        >
          <span
            className="me-2"
            style={{
              color: rule.isValid ? "var(--bs-success)" : "var(--bs-danger)"
            }}
            aria-label={rule.isValid ? "valid" : "invalid"}
          >
            {rule.isValid ? "✓" : "✗"}
          </span>
          <span style={{ color: rule.isValid ? "inherit" : "inherit" }}>
            {rule.message}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default PasswordChecklist;
