import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    onChange?.(allValid);
  }, [allValid, onChange]);

  return (
    <ul className="space-y-1.5">
      {validationRules.map((rule) => (
        <li key={rule.key} className="flex items-center gap-2 text-sm">
          {rule.isValid ? (
            <CheckCircle2
              className="size-4 shrink-0 text-green-500"
              aria-hidden="true"
            />
          ) : (
            <XCircle
              className="size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              rule.isValid ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {rule.message}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default PasswordChecklist;
