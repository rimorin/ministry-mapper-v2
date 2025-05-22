import { memo, MouseEventHandler, ReactNode } from "react";
import { Button } from "react-bootstrap";

interface GenericButtonProps {
  label: ReactNode;
  size?: "sm" | "lg";
  variant?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  dataAttributes?: Record<string, string>;
}

const GenericButton = memo(
  ({
    label,
    size = "sm",
    variant = "outline-primary",
    className = "",
    type = "button",
    dataAttributes = {},
    disabled = false,
    onClick
  }: GenericButtonProps) => {
    const dataProps: Record<string, string> = {};
    Object.entries(dataAttributes).forEach(([key, value]) => {
      dataProps[`data-${key}`] = value;
    });
    return (
      <Button
        variant={variant}
        className={className}
        size={size}
        onClick={onClick}
        type={type}
        disabled={disabled}
        {...dataProps}
      >
        {label}
      </Button>
    );
  }
);

export default GenericButton;
