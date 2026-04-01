import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const PwaUnsupported = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("pwa.unsupported.title")}>
      <Card.Text className="text-justify">
        {t("pwa.unsupported.message")}
      </Card.Text>
    </StaticPageCard>
  );
};

export default PwaUnsupported;
