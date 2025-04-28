import { FC } from "react";
import { useTranslation } from "react-i18next";

const VersionDisplay: FC = () => {
  const { t } = useTranslation();
  const { VITE_SYSTEM_ENVIRONMENT, VITE_VERSION } = import.meta.env;

  if (!VITE_SYSTEM_ENVIRONMENT?.startsWith("production")) {
    return null;
  }

  return (
    <div className="fixed-bottom text-muted opacity-25 m-2">
      {t("common.version", "v{{version}}", { version: VITE_VERSION })}
    </div>
  );
};

export default VersionDisplay;
