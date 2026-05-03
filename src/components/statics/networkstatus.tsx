import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNetworkStatusContext } from "../middlewares/networkstatuscontext";
import "../../css/networkstatus.css";

export const NetworkStatusBanner: FC = () => {
  const { t } = useTranslation();
  const { isOnline, isSlow } = useNetworkStatusContext();

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {!isOnline && (
        <div className="network-status-indicator">
          <span aria-hidden="true">📵</span>
          {t("common.noConnection", "No internet connection")}
        </div>
      )}
      {isOnline && isSlow && (
        <div className="network-status-indicator" data-slow="true">
          <span aria-hidden="true">📶</span>
          {t("common.weakConnection", "Weak connection")}
        </div>
      )}
    </div>
  );
};
