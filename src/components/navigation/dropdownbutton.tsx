import { memo } from "react";
import { Dropdown, DropdownButton as BSDropdownButton } from "react-bootstrap";
import {
  GenericDropdownButtonProps,
  GenericDropdownItemProps
} from "../../utils/interface";

const GenericDropdownButton = memo(
  ({
    label,
    className = "dropdown-btn",
    align = "end",
    variant = "outline-primary",
    size = "sm",
    drop,
    onClick,
    children
  }: GenericDropdownButtonProps) => {
    return (
      <BSDropdownButton
        className={className}
        align={align}
        variant={variant}
        size={size}
        title={label}
        drop={drop}
        onClick={onClick}
      >
        {children}
      </BSDropdownButton>
    );
  }
);

const GenericDropdownItem = memo(
  ({ onClick, children }: GenericDropdownItemProps) => {
    return <Dropdown.Item onClick={onClick}>{children}</Dropdown.Item>;
  }
);

export { GenericDropdownButton, GenericDropdownItem };
