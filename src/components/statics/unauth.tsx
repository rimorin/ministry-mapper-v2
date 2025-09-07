import { Container, Card } from "react-bootstrap";
import { SignInDifferentProps } from "../../utils/interface";
import UseAnotherButton from "../navigation/useanother";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const UnauthorizedPage = ({ handleClick, name }: SignInDifferentProps) => {
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
            {t("auth.unauthorizedAccessTitle", "Unauthorized Access 🔐")}
          </Card.Title>
          <Card.Text className="text-justify">
            {t(
              "auth.unauthorizedAccessMessage",
              "We are sorry {{name}}! You are not authorised to access this system.",
              { name }
            )}
          </Card.Text>
        </Card.Body>
        <UseAnotherButton handleClick={handleClick} />
      </Card>
    </Container>
  );
};

export default UnauthorizedPage;
