import { EnvironmentIndicatorProps } from "../../utils/interface";
import { cn } from "@/lib/utils";

const ENV_CONFIG: Record<string, { label: string; className: string }> = {
  production: {
    label: "PROD",
    className: "bg-amber-500/20 text-amber-500 hover:bg-amber-500/40"
  },
  staging: {
    label: "STG",
    className: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/40"
  },
  development: {
    label: "DEV",
    className: "bg-green-500/20 text-green-400 hover:bg-green-500/40"
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
