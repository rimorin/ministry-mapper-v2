import { Container, Card, Spinner } from "react-bootstrap";
import { userInterface } from "../../utils/interface";
import UseAnotherButton from "./useanother";
import { useState } from "react";
import useNotification from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

import { cleanupSession, verifyEmail } from "../../utils/pocketbase";

const VerificationPage = ({ user }: userInterface) => {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const userEmail = user?.email;
  const [isSending, setIsSending] = useState(false);

  const handleResendMail = async () => {
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
  };

  const handleClick = () => cleanupSession();

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
            {t(
              "auth.verifyEmailMessage",
              "Please verify your email address to continue."
            )}
          </Card.Title>
          <Card.Text className="text-center mb-4">
            {t("auth.didNotReceiveEmail", "Didn't receive verification email?")}
          </Card.Text>
          <div className="text-center">
            {isSending ? (
              <Spinner size="sm" />
            ) : (
              <span
                className="resend-text"
                onClick={handleResendMail}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleResendMail();
                  }
                }}
              >
                {t("auth.resendVerificationEmail", "Resend verification email")}
              </span>
            )}
          </div>
        </Card.Body>
        <UseAnotherButton handleClick={handleClick} />
      </Card>
    </Container>
  );
};

export default VerificationPage;
