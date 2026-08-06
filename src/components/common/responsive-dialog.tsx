import { ReactNode, createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { getIsMobile } from "../../hooks/use-mobile";

const SheetContext = createContext(false);

const useSheet = () => useContext(SheetContext);

// Narrower than the Dialog/Drawer root props on purpose: the two roots
// disagree on onOpenChange's eventDetails parameter, and useBaseUiDialog only
// ever supplies these three (a fewer-args callback satisfies both roots).
type ResponsiveDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  children: ReactNode;
};

const ResponsiveDialog = ({ children, ...props }: ResponsiveDialogProps) => {
  // Presentation is latched once per mount: NiceModal mounts a fresh instance
  // on every show(), and swapping Dialog/Drawer mid-open would remount the
  // portal and drop the exit animation.
  const [isSheet] = useState(getIsMobile);
  if (isSheet) {
    return (
      <SheetContext.Provider value={true}>
        <Drawer showSwipeHandle {...props}>
          {children}
        </Drawer>
      </SheetContext.Provider>
    );
  }
  return (
    <SheetContext.Provider value={false}>
      <Dialog {...props}>{children}</Dialog>
    </SheetContext.Provider>
  );
};

const ResponsiveDialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) => {
  const isSheet = useSheet();
  if (isSheet) {
    // Dialog size classes (sm:max-w-*) are not forwarded — a bottom sheet is
    // always full-width. The inner div mirrors the dialog's p-6/gap-6 body so
    // children render identically in both presentations.
    return (
      <DrawerContent>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 pt-2">
          {children}
        </div>
      </DrawerContent>
    );
  }
  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
};

const ResponsiveDialogHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const isSheet = useSheet();
  if (isSheet) {
    return (
      <div
        data-slot="drawer-header"
        className={cn("flex shrink-0 flex-col gap-2", className)}
        {...props}
      />
    );
  }
  return <DialogHeader className={className} {...props} />;
};

const ResponsiveDialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) => {
  const isSheet = useSheet();
  if (isSheet) {
    return (
      <DrawerTitle
        className={cn("leading-none font-medium", className)}
        {...props}
      />
    );
  }
  return <DialogTitle className={className} {...props} />;
};

const ResponsiveDialogFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const isSheet = useSheet();
  if (isSheet) {
    return (
      <div
        data-slot="drawer-footer"
        className={cn(
          "mt-auto flex shrink-0 flex-col-reverse gap-2",
          className
        )}
        {...props}
      />
    );
  }
  return <DialogFooter className={className} {...props} />;
};

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
};
