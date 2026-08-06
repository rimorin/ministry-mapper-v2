import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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
  const stats = [
    {
      value: notDone,
      tone: "text-amber-500",
      label: t("territory.notDone", "Not Done")
    },
    {
      value: notHome,
      tone: "text-sky-500",
      label: t("territory.notHome", "Not Home")
    },
    {
      value: progress,
      tone: "text-emerald-500",
      label: t("territory.completed", "Completed")
    }
  ];

  return (
    <div className="flex justify-center gap-4">
      {stats.map(({ value, tone, label }, index) => (
        <div
          key={label}
          className={cn("text-center", index > 0 && "border-l pl-4")}
        >
          <div
            className={cn(
              "font-bold tabular-nums",
              tone,
              size === "lg" ? "text-xl" : "text-sm"
            )}
          >
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
