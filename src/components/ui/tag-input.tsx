import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onAttemptAdd?: (raw: string) => string | null;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function TagInput({
  value,
  onChange,
  onAttemptAdd,
  placeholder,
  className,
  id,
  ...ariaProps
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const resolved = onAttemptAdd ? onAttemptAdd(trimmed) : trimmed;
    if (!resolved) return;
    if (value.includes(resolved)) return;
    onChange([...value, resolved]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "cursor-text",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 rounded-sm pr-1 text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Remove ${tag}`}
            className="ml-0.5 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(inputValue)}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-16 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        {...ariaProps}
      />
    </div>
  );
}
