import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const MaintenanceMode = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("maintenance.maintenanceMode")}>
      <Card.Text className="text-justify">
        {t("maintenance.backSoon")}
      </Card.Text>
    </StaticPageCard>
  );
};

export default MaintenanceMode;
