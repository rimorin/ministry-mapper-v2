import { FC } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useNetworkStatusContext } from "../middlewares/networkstatuscontext";
import "../../css/networkstatus.css";

// status-pulse (CSS) handles the steady-state opacity pulse; Motion owns the
// enter/exit opacity + slide. The 0.3s overlap on mount/unmount is acceptable.
const networkStatusIndicatorClassName =
  "fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-[max(0.5rem,env(safe-area-inset-right))] z-[1030] inline-flex max-w-[calc(100vw-1rem-env(safe-area-inset-right))] items-center gap-1 whitespace-nowrap rounded-full bg-[var(--mm-danger)] px-2 py-[0.2rem] text-xs text-white select-none [animation:status-pulse_2s_ease-in-out_infinite] motion-reduce:[animation:none]";

const bannerMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: { type: "spring", visualDuration: 0.4, bounce: 0.2 }
} as const;

export const NetworkStatusBanner: FC = () => {
  const { t } = useTranslation();
  const { isOnline, isSlow } = useNetworkStatusContext();

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {!isOnline && (
          <m.div
            key="offline"
            className={networkStatusIndicatorClassName}
            data-network-status="true"
            {...bannerMotion}
          >
            <span aria-hidden="true">📵</span>
            {t("common.noConnection", "No internet connection")}
          </m.div>
        )}
        {isOnline && isSlow && (
          <m.div
            key="slow"
            className={networkStatusIndicatorClassName}
            data-network-status="true"
            data-slow="true"
            {...bannerMotion}
          >
            <span aria-hidden="true">📶</span>
            {t("common.weakConnection", "Weak connection")}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
