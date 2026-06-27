import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  className?: string;
  label?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select...",
  noOptionsMessage = "No options available.",
  className,
  label = "Select options"
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(value);

  const selectedItems = options.filter((o) => value.includes(o.value));

  const handleOpen = () => {
    setDraft(value);
    setOpen(true);
  };

  const handleDone = () => {
    onChange?.(draft);
    setOpen(false);
  };

  const toggleDraft = (optValue: string) => {
    setDraft((prev) =>
      prev.includes(optValue)
        ? prev.filter((v) => v !== optValue)
        : [...prev, optValue]
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent py-1.5 pl-2.5 pr-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <div className="flex flex-1 min-w-0 flex-wrap gap-1 py-0.5">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="rounded-sm text-xs font-medium"
              >
                {opt.label}
              </Badge>
            ))
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOpen(false);
          }
        }}
      >
        <DialogContent
          className="flex flex-col gap-0 p-0 max-h-[80dvh]"
          overlayForceRender
        >
          <DialogHeader className="px-4 py-4 border-b">
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {options.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {noOptionsMessage}
              </p>
            ) : (
              <ul className="divide-y">
                {options.map((option) => {
                  const selected = draft.includes(option.value);
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => toggleDraft(option.value)}
                        className="flex w-full items-center gap-4 px-4 py-3.5 text-sm hover:bg-accent focus-visible:outline-none focus-visible:bg-accent"
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-sm border border-input",
                            selected &&
                              "bg-primary border-primary text-primary-foreground"
                          )}
                        >
                          {selected && <Check className="size-3.5" />}
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-left text-base",
                            selected && "font-medium"
                          )}
                        >
                          {option.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="px-4 py-3 border-t">
            <Button onClick={handleDone} className="w-full">
              Done{draft.length > 0 && ` (${draft.length} selected)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
