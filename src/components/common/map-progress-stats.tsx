import { useTranslation } from "react-i18next";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import NotHomeIcon from "../table/nothome";

interface MapProgressStatsProps {
  notDone: number;
  notHome: number;
  progress: string;
  size?: "sm" | "lg";
}

const MapProgressStats = ({
  notDone,
  notHome,
  progress,
  size = "lg"
}: MapProgressStatsProps) => {
  const { t } = useTranslation();
  // Same glyphs as the unit tiles; the labels alone read too alike at this size.
  const stats = [
    {
      value: notDone,
      tone: "text-status-notdone",
      icon: <Circle className="size-3.5 shrink-0" aria-hidden="true" />,
      label: t("territory.notDone", "Not Done")
    },
    {
      value: notHome,
      tone: "text-status-nothome",
      icon: <NotHomeIcon iconClassName="size-3.5 shrink-0" />,
      label: t("territory.notHome", "Not Home")
    },
    {
      value: progress,
      tone: "text-status-done",
      icon: <Check className="size-3.5 shrink-0" aria-hidden="true" />,
      label: t("territory.completed", "Completed")
    }
  ];

  return (
    <div className="flex justify-center gap-4">
      {stats.map(({ value, tone, icon, label }, index) => (
        <div
          key={label}
          className={cn("text-center", index > 0 && "border-l pl-4")}
        >
          <div
            className={cn(
              "flex items-center justify-center gap-1 font-bold tabular-nums",
              tone,
              size === "lg" ? "text-xl" : "text-sm"
            )}
          >
            {icon}
            {value}
          </div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MapProgressStats;
