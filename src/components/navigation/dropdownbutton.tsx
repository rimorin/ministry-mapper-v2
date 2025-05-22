import { memo, ReactNode } from "react";
import { Dropdown, DropdownButton as BSDropdownButton } from "react-bootstrap";
import { DropDirection } from "../../utils/interface";

interface GenericDropdownButtonProps {
  label: ReactNode;
  className?: string;
  align?:
    | "start"
    | "end"
    | { sm: "start" | "end" }
    | { md: "start" | "end" }
    | { lg: "start" | "end" }
    | { xl: "start" | "end" }
    | { xxl: "start" | "end" };
  variant?: string;
  size?: "sm" | "lg";
  drop?: DropDirection;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children: ReactNode;
}

interface GenericDropdownItemProps {
  onClick?: () => void;
  children: ReactNode;
}

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
