import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GenericDropdownButtonProps,
  GenericDropdownItemProps
} from "../../utils/interface";

const GenericDropdownButton = ({
  label,
  className = "inline-block m-1",
  align = "end",
  variant = "outline",
  size = "sm",
  onClick,
  children
}: GenericDropdownButtonProps) => {
  type ButtonVariant =
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant as ButtonVariant}
            size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
            className={cn(className)}
            onClick={onClick}
          />
        }
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align === "end" ? "end" : "start"}
        className="w-auto min-w-[10rem]"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const GenericDropdownItem = ({
  onClick,
  children,
  icon,
  variant = "default"
}: GenericDropdownItemProps) => {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        "gap-2 whitespace-nowrap",
        variant === "destructive" &&
          "text-destructive focus:text-destructive focus:bg-destructive/10"
      )}
    >
      {icon && (
        <span className="size-4 shrink-0 text-muted-foreground [.text-destructive_&]:text-destructive">
          {icon}
        </span>
      )}
      {children}
    </DropdownMenuItem>
  );
};

export {
  GenericDropdownButton,
  GenericDropdownItem,
  DropdownMenuSeparator as GenericDropdownSeparator
};
