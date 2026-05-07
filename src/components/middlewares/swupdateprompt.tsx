import { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useToast } from "./toast";

const SwUpdatePrompt = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const handleSwUpdate = () => {
      showToast(
        <div className="d-flex justify-content-between align-items-center gap-3">
          <span>
            {t("update.message", "Reload to get the latest updates.")}
          </span>
          <Button
            variant="primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => window.location.reload()}
          >
            {t("update.reload", "Reload")}
          </Button>
        </div>,
        "info",
        t("update.title", "Update Available"),
        { autohide: false }
      );
    };

    window.addEventListener("mm-sw-update", handleSwUpdate);
    return () => window.removeEventListener("mm-sw-update", handleSwUpdate);
  }, [showToast, t]);

  return null;
};

export default SwUpdatePrompt;
