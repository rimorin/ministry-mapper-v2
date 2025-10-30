import { Button } from "react-bootstrap";
import { GenericButtonProps } from "../../utils/interface";

const GenericButton = ({
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
};

export default GenericButton;
