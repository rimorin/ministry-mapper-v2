import { memo } from "react";
import { Container, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const MaintenanceMode = memo(() => {
  const { t } = useTranslation();

  return (
    <Container className="container-main">
      <Card className="card-main">
        <Card.Img
          alt="Ministry Mapper logo"
          className="mm-logo"
          src="https://assets.ministry-mapper.com/android-chrome-192x192.png"
        />
        <Card.Body>
          <Card.Title className="text-center">
            {t("maintenance.maintenanceMode")}
          </Card.Title>
          <Card.Text className="text-justify">
            {t("maintenance.backSoon")}
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default MaintenanceMode;
