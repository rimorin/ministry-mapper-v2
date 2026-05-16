import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CongregationListingProps } from "../../utils/interface";
import UserRoleBadge from "./rolebadge";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const CongListing = ({
  showListing,
  hideFunction,
  currentCongCode,
  handleSelect,
  congregations
}: CongregationListingProps) => {
  const { t } = useTranslation();
  const currentCongregations = congregations
    ? congregations.filter((element) => element.code !== currentCongCode)
    : [];

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
              {t("congregation.selectCongregation")}
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
            {currentCongregations.map((element) => (
              <button
                type="button"
                key={`list-group-item-${element.code}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => handleSelect?.(element.code, e)}
              >
                <span className="min-w-0 truncate font-semibold">
                  {element.name}
                </span>
                <span className="shrink-0">
                  <UserRoleBadge role={element.access} />
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CongListing;
