import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

// Root renders no element of its own, so it is re-exported unwrapped; a
// wrapper would only get in the way of its three type parameters.
const Combobox = ComboboxPrimitive.Root;

function ComboboxInputGroup({
  className,
  ...props
}: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(
        "relative flex h-9 w-full items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className
      )}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        "h-full w-full border-0 bg-transparent pl-3 pr-16 text-sm outline-none placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

// Sits over the input's right padding, which is why ComboboxInput reserves pr-16.
function ComboboxActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-actions"
      className={cn(
        "absolute right-1 flex h-9 items-center gap-0.5 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function ComboboxClear({
  className,
  children,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  const { t } = useTranslation();

  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      aria-label={t("common.clear", "Clear")}
      className={cn(
        "flex size-7 items-center justify-center rounded hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? <X className="size-3.5" />}
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  const { t } = useTranslation();

  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      aria-label={t("common.open", "Open")}
      className={cn(
        "flex size-7 items-center justify-center rounded hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? <ChevronDown className="size-4" />}
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxContent({
  className,
  sideOffset = 4,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "sideOffset">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        sideOffset={sideOffset}
        className="isolate z-[2001] outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "max-h-[min(var(--available-height),20rem)] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md transition-[transform,scale,opacity] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

// Status and Empty are aria-live regions: Base UI requires their own element to
// stay mounted, so the padded box is an inner child that appears only when
// there is something to announce. Styling the region itself would leave a gap
// in the popup the rest of the time.
function ComboboxStatus({
  className,
  children,
  ...props
}: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status data-slot="combobox-status" {...props}>
      {children ? (
        <div
          className={cn("px-3 py-1.5 text-xs text-muted-foreground", className)}
        >
          {children}
        </div>
      ) : null}
    </ComboboxPrimitive.Status>
  );
}

function ComboboxEmpty({
  className,
  children,
  ...props
}: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty data-slot="combobox-empty" {...props}>
      <div
        className={cn("px-3 py-1.5 text-xs text-muted-foreground", className)}
      >
        {children}
      </div>
    </ComboboxPrimitive.Empty>
  );
}

function ComboboxList({ ...props }: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" {...props} />;
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        className
      )}
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator className="flex size-3.5 items-center justify-center">
        <Check className="size-3.5" />
      </ComboboxPrimitive.ItemIndicator>
      {children}
    </ComboboxPrimitive.Item>
  );
}

export {
  Combobox,
  ComboboxActions,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger
};
