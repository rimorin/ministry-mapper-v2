import { useEffect, useState } from "react";
import * as Sentry from "@sentry/react";

interface VersionInfo {
  version: string;
  buildTime: string;
}

export function useVersionCheck(interval = 60000) {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    const currentVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data: VersionInfo = await response.json();
        if (data.version !== currentVersion) {
          setNeedRefresh(true);
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: "version-check" }
        });
      }
    };

    checkVersion();
    const timerId = setInterval(checkVersion, interval);

    return () => clearInterval(timerId);
  }, [interval]);

  return {
    needRefresh,
    refresh: () => window.location.reload()
  };
}
