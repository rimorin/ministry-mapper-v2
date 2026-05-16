import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageListingProps } from "../utils/interface";

const LanguageListing = ({
  showListing,
  hideFunction,
  handleSelect,
  currentLanguage,
  languageOptions = []
}: LanguageListingProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={showListing}
      onOpenChange={(open) => {
        if (!open) hideFunction();
      }}
    >
      <DialogContent className="max-w-xs gap-0 p-0">
        <DialogHeader className="border-b px-4 py-3 text-left">
          <DialogTitle>
            {t("common.selectLanguage", "Select Language")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 p-2">
          {languageOptions.map((option) => {
            const isActive = currentLanguage === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => handleSelect(option.value)}
                className="w-full justify-between font-semibold"
              >
                {option.label}
                {isActive && <Check className="size-4 text-primary" />}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageListing;
