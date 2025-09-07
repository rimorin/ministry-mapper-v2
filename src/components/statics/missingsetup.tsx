import { memo } from "react";
import { Container, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

interface MissingSetupPageProps {
  message: string;
}

const MissingSetupPage: React.FC<MissingSetupPageProps> = memo(
  ({ message }) => {
    const { t } = useTranslation();

    // Map known error messages to translation keys
    const getTranslationKey = (msg: string): string => {
      if (msg.includes("Google Maps API Key"))
        return "errors.missingGoogleMapsApiKey";
      if (msg.includes("PocketBase URL")) return "errors.missingPocketBaseUrl";
      return "errors.missingSetup";
    };

    return (
      <Container className="container-main">
        <Card className="card-main">
          <Card.Img
            alt="Ministry Mapper logo"
            className="mm-logo"
            src={getAssetUrl("android-chrome-192x192.png")}
          />
          <Card.Body>
            <Card.Title className="text-center">
              {t(getTranslationKey(message))}
            </Card.Title>
          </Card.Body>
        </Card>
      </Container>
    );
  }
);

export default MissingSetupPage;
