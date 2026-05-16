import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const MaintenanceMode = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("maintenance.maintenanceMode")}>
      <p className="text-justify text-sm text-muted-foreground">
        {t("maintenance.backSoon")}
      </p>
    </StaticPageCard>
  );
};

export default MaintenanceMode;
