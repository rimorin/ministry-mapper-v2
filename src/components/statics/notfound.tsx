import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("errors.pageNotFound", "404 Page Not Found 🚫")}>
      <Card.Text className="text-justify">
        {t(
          "errors.pageNotFoundMessage",
          "We are sorry, the page you requested could not be found."
        )}
      </Card.Text>
    </StaticPageCard>
  );
};

export default NotFoundPage;
