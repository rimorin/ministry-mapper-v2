import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GenericButtonProps } from "../../utils/interface";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "sm" | "default" | "lg" | "icon";

const sizeMap: Record<string, ButtonSize> = {
  sm: "sm",
  lg: "lg",
  "": "default"
};

const GenericButton = ({
  label,
  size = "sm",
  variant = "outline",
  className = "",
  type = "button",
  dataAttributes = {},
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
  title
}: GenericButtonProps) => {
  const dataProps: Record<string, string> = {};

  Object.entries(dataAttributes).forEach(([key, value]) => {
    dataProps[`data-${key}`] = value;
  });

  return (
    <Button
      variant={variant as ButtonVariant}
      size={sizeMap[size] ?? "default"}
      className={cn(className)}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      {...dataProps}
    >
      {label}
    </Button>
  );
};

export default GenericButton;
