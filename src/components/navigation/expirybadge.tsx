import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ONE_MINUTE_MS = 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

const calculateTimeLeft = (endTime: number): TimeLeft => {
  const totalMs = Math.max(endTime - Date.now(), 0);
  return {
    days: Math.floor(totalMs / ONE_DAY_MS),
    hours: Math.floor((totalMs % ONE_DAY_MS) / ONE_HOUR_MS),
    minutes: Math.floor((totalMs % ONE_HOUR_MS) / 60_000),
    seconds: Math.floor((totalMs % 60_000) / 1_000),
    totalMs
  };
};

const getUrgency = (totalMs: number) => {
  if (totalMs <= FIFTEEN_MINUTES_MS) return "critical";
  if (totalMs <= ONE_HOUR_MS) return "warning";
  return "safe";
};

// Seconds only in the final minute, the one stretch that ticks every second.
const formatDisplay = ({
  days,
  hours,
  minutes,
  seconds,
  totalMs
}: TimeLeft): string => {
  if (totalMs <= ONE_MINUTE_MS) {
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

interface ExpiryBadgeProps {
  endtime: number;
  onExpired?: () => void;
  plain?: boolean;
}

const ExpiryBadge = ({
  endtime,
  onExpired,
  plain = false
}: ExpiryBadgeProps) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endtime));
  const onExpiredCallback = useEffectEvent(() => {
    onExpired?.();
  });

  useEffect(() => {
    if (!endtime) return;

    const tick = () => {
      const next = calculateTimeLeft(endtime);
      setTimeLeft(next);
      return next.totalMs;
    };

    // Per-second ticks only matter in the final minute; coarser intervals above
    // that keep the CPU idle (a 1s timer for 15 min per badge drained battery).
    const getInterval = (totalMs: number) =>
      totalMs <= ONE_MINUTE_MS
        ? 1_000
        : totalMs <= FIFTEEN_MINUTES_MS
          ? 5_000
          : 60_000;

    let id: ReturnType<typeof setInterval>;

    const schedule = (totalMs: number) => {
      id = setInterval(() => {
        const remaining = tick();
        if (remaining <= 0) {
          clearInterval(id);
          onExpiredCallback();
          return;
        }
        // Switch interval granularity when crossing the critical threshold
        const next = getInterval(remaining);
        const current = getInterval(totalMs);
        if (next !== current) {
          clearInterval(id);
          schedule(remaining);
        }
      }, getInterval(totalMs));
    };

    schedule(calculateTimeLeft(endtime).totalMs);
    return () => clearInterval(id);
  }, [endtime]);

  if (!endtime || timeLeft.totalMs <= 0) return null;

  const urgency = getUrgency(timeLeft.totalMs);
  const display = formatDisplay(timeLeft);

  if (plain) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-sm tabular-nums transition-colors duration-700",
          urgency === "safe" && "text-muted-foreground",
          urgency === "warning" && "font-medium text-warning",
          urgency === "critical" && "font-medium text-destructive"
        )}
      >
        <Timer className="size-3.5" aria-hidden="true" />
        {t("assignments.expiresIn", "Expires in {{time}}", { time: display })}
      </span>
    );
  }

  return (
    <Badge
      variant={
        urgency === "critical"
          ? "destructive"
          : urgency === "warning"
            ? "outline"
            : "outline"
      }
      className={cn(
        "gap-1 font-variant-numeric tabular-nums select-none text-xs transition-[color,border-color,background-color,opacity] duration-700 ease-in-out motion-reduce:transition-none",
        urgency === "safe" && "opacity-75",
        urgency === "warning" && "border-warning text-warning",
        urgency === "critical" && "animate-pulse motion-reduce:animate-none"
      )}
      role="timer"
      aria-live="polite"
      aria-label={t("assignments.expiresIn", "Expires in {{time}}", {
        time: display
      })}
    >
      <Timer aria-hidden="true" />
      <span>{t("assignments.expires", "Expires")}</span>
      {display}
    </Badge>
  );
};

export default ExpiryBadge;
