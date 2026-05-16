import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserListingProps } from "../../utils/interface";
import UserRoleBadge from "./rolebadge";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const UserListing = ({
  showListing,
  hideFunction,
  handleSelect,
  users
}: UserListingProps) => {
  const { t } = useTranslation();

  return (
    <Sheet open={showListing} onOpenChange={(open) => !open && hideFunction()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[100dvh] gap-0 overflow-hidden p-0 sm:h-[85dvh] sm:rounded-t-2xl"
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="fluid-text font-bold text-left">
              {t("user.selectUser")}
            </SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                />
              }
            >
              <X className="size-4" />
            </SheetClose>
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1" withFade>
          <div className="divide-y">
            {users?.map((element) => (
              <button
                type="button"
                key={`list-group-item-${element.roleId}`}
                className="w-full px-4 py-3.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => handleSelect?.(element.roleId, e)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold">
                    {element.name}
                  </span>
                  <span className="shrink-0">
                    <UserRoleBadge role={element.role.toString()} />
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {element.email}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default UserListing;
