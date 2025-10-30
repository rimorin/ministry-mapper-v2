import { Container, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const InvalidPage = () => {
  const { t } = useTranslation();

  return (
    <Container className="container-main">
      <Card className="card-main">
        <Card.Img
          alt={t("branding.logo", "Ministry Mapper logo")}
          className="mm-logo"
          src={getAssetUrl("android-chrome-192x192.png")}
        />
        <Card.Body>
          <Card.Title className="text-center">
            {t("errors.linkExpired", "This link has expired ⌛")}
          </Card.Title>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InvalidPage;
