import { Container, Card, Spinner } from "react-bootstrap";
import { userInterface } from "../../utils/interface";
import UseAnotherButton from "./useanother";
import { useCallback, useState } from "react";
import useNotification from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

import { cleanupSession, verifyEmail } from "../../utils/pocketbase";

const VerificationPage = ({ user }: userInterface) => {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const userEmail = user?.email;
  const [isSending, setIsSending] = useState(false);

  const handleResendMail = useCallback(async () => {
    setIsSending(true);
    try {
      await verifyEmail(userEmail);
      notifySuccess(
        t(
          "auth.verificationEmailResent",
          "Resent verification email! Please check your inbox or spam folder."
        )
      );
    } catch (error) {
      notifyError(error);
    } finally {
      setIsSending(false);
    }
  }, [userEmail, notifySuccess, notifyError, t]);

  const handleClick = useCallback(() => cleanupSession(), []);

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
            {t(
              "auth.verifyEmailMessage",
              "We are sorry {{name}}! Please verify your email account before proceeding 🪪",
              { name: user?.name }
            )}
          </Card.Title>
        </Card.Body>
        <>
          <span
            className="resend-text fluid-bolding fluid-text"
            onClick={handleResendMail}
          >
            {t("auth.didNotReceiveEmail", "Didn't receive verification email?")}
            {isSending && (
              <Spinner
                size="sm"
                style={{
                  marginLeft: "5px"
                }}
              />
            )}
          </span>
        </>
        <>
          <UseAnotherButton handleClick={handleClick} />
        </>
      </Card>
    </Container>
  );
};

export default VerificationPage;
