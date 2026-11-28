import { useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { toast } from "@/components/ui/toast-manager";
import useUpdateOnScreenChange from "@/hooks/useUpdateOnScreenChange";
import { isUpdateReady } from "@/utils/appUpdate";
import { reloadForNewDeploy } from "@/utils/reloadForNewDeploy";

const SwUpdatePrompt = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  useUpdateOnScreenChange(location);

  const showToast = useEffectEvent(() => {
    toast.add({
      id: "sw-update",
      title: t("update.title", "Update Available"),
      description: t("update.message", "Reload to get the latest updates."),
      timeout: 0,
      actionProps: {
        children: t("update.reload", "Reload"),
        onClick: reloadForNewDeploy
      }
    });
  });

  useEffect(() => {
    const handleUpdate = () => showToast();
    window.addEventListener("mm-sw-update", handleUpdate);
    // The check at start can finish before this mounts.
    if (isUpdateReady()) showToast();
    return () => window.removeEventListener("mm-sw-update", handleUpdate);
  }, []);

  return null;
};

export default SwUpdatePrompt;
