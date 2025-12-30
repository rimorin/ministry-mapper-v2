import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import "../../css/networkstatus.css";

const ANIMATION_DURATION = 300;

export function NetworkStatusBanner() {
  const { t } = useTranslation();
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isDismissed, setIsDismissed] = useLocalStorage(
    "network-banner-dismissed",
    false
  );

  const currentProblemType = !isOnline
    ? "offline"
    : isSlowConnection
      ? "slow"
      : null;
  const prevProblemTypeRef = useRef<"offline" | "slow" | null>(
    currentProblemType
  );

  const showBanner = currentProblemType !== null && !isDismissed;

  useEffect(() => {
    const prevProblemType = prevProblemTypeRef.current;
    const problemTypeChanged =
      prevProblemType !== currentProblemType && currentProblemType !== null;

    if (problemTypeChanged && isDismissed) {
      setIsDismissed(false);
    }

    prevProblemTypeRef.current = currentProblemType;
  }, [currentProblemType, isDismissed, setIsDismissed]);

  useEffect(() => {
    if (showBanner) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  if (!shouldRender) return null;

  const className = `network-status-banner ${isVisible ? "visible" : ""} ${
    !isOnline ? "offline" : "slow"
  }`;

  return (
    <div
      className={className}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="network-status-text">
        {!isOnline
          ? `⚠️ ${t("common.noConnection")}`
          : `🐌 ${t("common.weakConnection")}`}
      </span>
      <button
        className="network-status-dismiss"
        onClick={() => setIsDismissed(true)}
        aria-label="Dismiss notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
