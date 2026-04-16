import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

const formatDisplay = ({
  days,
  hours,
  minutes,
  seconds,
  totalMs
}: TimeLeft): string => {
  if (totalMs <= FIFTEEN_MINUTES_MS) {
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

interface ExpiryBadgeProps {
  endtime: number;
}

const ExpiryBadge = ({ endtime }: ExpiryBadgeProps) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endtime));

  useEffect(() => {
    if (!endtime) return;

    const tick = () => {
      const next = calculateTimeLeft(endtime);
      setTimeLeft(next);
      return next.totalMs;
    };

    // Tick every second in critical state, every minute otherwise
    const getInterval = (totalMs: number) =>
      totalMs <= FIFTEEN_MINUTES_MS ? 1_000 : 60_000;

    let id: ReturnType<typeof setInterval>;

    const schedule = (totalMs: number) => {
      id = setInterval(() => {
        const remaining = tick();
        if (remaining <= 0) {
          clearInterval(id);
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

  return (
    <span
      className={`expiry-badge expiry-badge--${urgency}`}
      role="timer"
      aria-live="polite"
      aria-label={t("assignments.expiresIn", "Expires in {{time}}", {
        time: display
      })}
    >
      <span aria-hidden="true">⌛</span>
      {display}
    </span>
  );
};

export default ExpiryBadge;
