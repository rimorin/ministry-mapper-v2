import { memo } from "react";
import { Container, Card } from "react-bootstrap";
import { WelcomeProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const Welcome = memo(({ name }: WelcomeProps) => {
  const { t } = useTranslation();

  return (
    <Container className="container-main">
      <Card className="welcome-card">
        <div className="welcome-image-container">
          <img
            alt="Ministry Mapper logo"
            className="welcome-image"
            src={getAssetUrl("logo.png")}
          />
        </div>
        <Card.Body className="welcome-card-body">
          <h2 className="welcome-card-title">
            {t("auth.welcome")} {name || t("auth.welcomeDefault")}! 👋
          </h2>
          <p className="welcome-card-text">{t("territory.selectTerritory")}</p>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default Welcome;
