import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useVersionCheck } from "../../hooks/useVersionCheck";
import { useToast } from "../middlewares/toast";

const RESHOW_INTERVAL = 5 * 60 * 1000;

export function UpdateNotification() {
  const { t } = useTranslation();
  const { needRefresh, refresh } = useVersionCheck(60000);
  const { showToast } = useToast();
  const lastShownTime = useRef(0);

  useEffect(() => {
    if (needRefresh) {
      const now = Date.now();
      if (now - lastShownTime.current >= RESHOW_INTERVAL) {
        lastShownTime.current = now;
        showToast(
          <div className="d-flex align-items-center justify-content-between w-100">
            <span>{t("update.message")}</span>
            <button
              onClick={refresh}
              className="btn btn-sm btn-light ms-3"
              aria-label={t("update.reload")}
            >
              {t("update.reload")}
            </button>
          </div>,
          "info",
          t("update.title"),
          { autohide: false }
        );
      }
    }
  }, [needRefresh, refresh, showToast, t]);

  return null;
}
