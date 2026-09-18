import { EnvironmentIndicatorProps } from "../../utils/interface";
import { cn } from "@/lib/utils";

const ENV_CONFIG: Record<string, { label: string; className: string }> = {
  production: {
    label: "PROD",
    className: "bg-warning/20 text-warning hover:bg-warning/40"
  },
  staging: {
    label: "STG",
    className: "bg-info/20 text-info hover:bg-info/40"
  },
  development: {
    label: "DEV",
    className: "bg-success/20 text-success hover:bg-success/40"
  }
};

const EnvironmentIndicator = ({
  environment = "production"
}: EnvironmentIndicatorProps) => {
  const key = environment.toLowerCase().startsWith("prod")
    ? "production"
    : environment.toLowerCase().startsWith("stag")
      ? "staging"
      : "development";

  const { label, className } = ENV_CONFIG[key] ?? ENV_CONFIG.development;

  if (key === "production") return null;

  return (
    <span
      role="status"
      aria-label={`${environment} environment`}
      title={`${environment} environment`}
      className={cn(
        "fixed top-4 right-4 z-[1000] cursor-default select-none rounded-full border-0 px-2.5 py-1 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity motion-reduce:transition-none",
        className
      )}
    >
      {label}
    </span>
  );
};

export default EnvironmentIndicator;
