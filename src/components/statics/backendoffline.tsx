import { Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

interface BackendOfflineProps {
  onRetry: () => void;
}

const BackendOffline = ({ onRetry }: BackendOfflineProps) => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("backendOffline.title")}>
      <Card.Text className="text-justify">
        {t("backendOffline.description")}
      </Card.Text>
      <div className="text-center mt-2">
        <Button variant="primary" onClick={onRetry}>
          {t("backendOffline.retry")}
        </Button>
      </div>
    </StaticPageCard>
  );
};

export default BackendOffline;
