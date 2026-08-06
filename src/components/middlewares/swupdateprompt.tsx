import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/toast";

const SwUpdatePrompt = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSwUpdate = () => {
      toast.add({
        id: "sw-update",
        title: t("update.title", "Update Available"),
        description: t("update.message", "Reload to get the latest updates."),
        timeout: 0,
        actionProps: {
          children: t("update.reload", "Reload"),
          onClick: () => window.location.reload()
        }
      });
    };

    window.addEventListener("mm-sw-update", handleSwUpdate);
    return () => window.removeEventListener("mm-sw-update", handleSwUpdate);
  }, [t]);

  return null;
};

export default SwUpdatePrompt;
