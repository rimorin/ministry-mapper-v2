import { Container, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <Container className="container-main">
      <Card className="card-main">
        <Card.Img
          alt={t("branding.logo", "Ministry Mapper logo")}
          className="mm-logo"
          src="https://assets.ministry-mapper.com/android-chrome-192x192.png"
        />
        <Card.Body>
          <Card.Title className="text-center">
            {t("errors.pageNotFound", "404 Page Not Found 🚫")}
          </Card.Title>
          <Card.Text className="text-justify">
            {t(
              "errors.pageNotFoundMessage",
              "We are sorry, the page you requested could not be found."
            )}
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NotFoundPage;
