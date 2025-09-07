import { memo } from "react";
import { Container, Card } from "react-bootstrap";
import { WelcomeProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const Welcome = memo(({ name }: WelcomeProps) => {
  const { t } = useTranslation();

  return (
    <Container className="container-main">
      <Card className="card-main" style={{ width: "100%" }}>
        <Card.Img
          alt="Ministry Mapper main logo"
          className="mm-main-image"
          src={getAssetUrl("logo.png")}
        />
        <Card.Body>
          <Card.Title className="text-center">
            {t("auth.welcome")} {name || t("auth.welcomeDefault")}
          </Card.Title>
          <Card.Text className="text-justify">
            {t("territory.selectTerritory")}
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default Welcome;
