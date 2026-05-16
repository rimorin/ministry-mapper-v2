import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Car, Footprints } from "lucide-react";
import { TravelMode, TravelModeButtonsProps } from "../../utils/interface";

const TravelModeButtons: React.FC<TravelModeButtonsProps> = ({
  travelMode,
  onTravelModeChange,
  isLoading = false
}) => {
  const { t } = useTranslation();

  const modes: Array<{
    value: TravelMode;
    icon: React.ReactNode;
    label: string;
    position: string;
  }> = [
    {
      value: "WALKING",
      icon: <Footprints className="size-5" />,
      label: t("navigation.walkMode", "Walk"),
      position: "first"
    },
    {
      value: "DRIVING",
      icon: <Car className="size-5" />,
      label: t("navigation.driveMode", "Drive"),
      position: "last"
    }
  ];

  return (
    <div className="flex gap-0.5 rounded-lg bg-card p-1 shadow-sm">
      {modes.map((mode) => {
        const isActive = travelMode === mode.value;
        return (
          <Button
            key={mode.value}
            type="button"
            size="sm"
            variant="ghost"
            aria-label={mode.label}
            aria-pressed={isActive}
            onClick={() => onTravelModeChange(mode.value)}
            disabled={isLoading}
            className={cn(
              "relative flex min-h-11 min-w-[60px] flex-1 flex-col items-center justify-center gap-px rounded-md border border-border px-2 py-1 text-[13px] font-medium shadow-none transition-[background-color,color] duration-200 ease-in",
              isActive
                ? "bg-background text-foreground shadow-xs hover:bg-background"
                : "text-muted-foreground hover:bg-transparent hover:text-foreground",
              isLoading && "opacity-50"
            )}
          >
            {isLoading && isActive && (
              <div
                className={cn("travel-mode-btn-spinner-overlay", mode.position)}
              >
                <Spinner aria-hidden="true" className="text-primary" />
              </div>
            )}
            <span className="text-base">{mode.icon}</span>
            <span className="text-[10px]">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default TravelModeButtons;
