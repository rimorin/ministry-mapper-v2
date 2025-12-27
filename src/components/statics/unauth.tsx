import { Container, Card, Alert } from "react-bootstrap";
import { SignInDifferentProps } from "../../utils/interface";
import UseAnotherButton from "../navigation/useanother";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const UnauthorizedPage = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();

  return (
    <Container className="container-main">
      <Card className="card-main">
        <Card.Body className="text-center">
          <Card.Img
            alt={t("branding.logo", "Ministry Mapper logo")}
            className="mm-logo mx-auto d-block"
            src={getAssetUrl("android-chrome-192x192.png")}
          />
        </Card.Body>
        <Card.Body>
          <Card.Title className="text-center">
            {t("auth.unauthorizedAccessTitle", "Access Denied 🔐")}
          </Card.Title>
          <Card.Text className="text-center mb-4">
            {t(
              "auth.unauthorizedAccessMessage",
              "You don't have permission to access this system."
            )}
          </Card.Text>
          <Alert variant="warning">
            <Alert.Heading as="h6" className="text-center mb-3">
              {t("auth.contactInstructions", "What can you do?")}
            </Alert.Heading>
            <hr />
            <p className="mb-3">
              <strong>
                {t("auth.existingUserTitle", "Already part of a congregation?")}
              </strong>
              <br />
              {t(
                "auth.existingUserMessage",
                "Ask your administrator to grant you access."
              )}
            </p>
            <hr />
            <p>
              <strong>{t("auth.newUserTitle", "Need a new account?")}</strong>
              <br />
              {t("auth.newUserMessage", "Please")}{" "}
              <a href="mailto:rimorin@gmail.com">
                {t("auth.emailLinkText", "contact us")}
              </a>{" "}
              {t("auth.newUserMessageEnd", "to set up access.")}
            </p>
          </Alert>
        </Card.Body>
        <UseAnotherButton handleClick={handleClick} />
      </Card>
    </Container>
  );
};

export default UnauthorizedPage;
