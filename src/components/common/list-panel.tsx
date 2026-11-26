import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";

interface ListPanelProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  // Beside the title, before the close button.
  actions?: ReactNode;
  // Off where tabs follow the header and draw their own edge.
  bordered?: boolean;
  children: ReactNode;
}

// The territory, congregation and people lists: a full-height sheet from the
// bottom on a phone, a centred dialog on a wider screen, as Send link is.
// Sheet and Dialog share Base UI's dialog, so only the frame changes.
const ListPanel = ({
  open,
  onClose,
  title,
  actions,
  bordered = true,
  children
}: ListPanelProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const body = (
    <>
      <SheetHeader className={cn("px-4 py-3", bordered && "border-b")}>
        <div className="flex items-center gap-3">
          <SheetTitle className="fluid-text mr-auto text-left font-bold">
            {title}
          </SheetTitle>
          {actions}
          <SheetClose
            aria-label={t("common.close", "Close")}
            render={
              <Button variant="ghost" size="icon" className="size-8 shrink-0" />
            }
          >
            <X className="size-4" aria-hidden="true" />
          </SheetClose>
        </div>
      </SheetHeader>
      {children}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {isMobile ? (
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-[100dvh] gap-0 overflow-hidden p-0"
        >
          {body}
        </SheetContent>
      ) : (
        <DialogContent className="flex h-[min(85dvh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px]">
          {body}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ListPanel;
