import { useCallback, useContext, useState } from "react";
import { Form, Spinner, FloatingLabel } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import useNotification from "../hooks/useNotification";
import { StateContext } from "../components/utils/context";
import { requestPasswordReset } from "../utils/pocketbase";
import GenericButton from "../components/navigation/button";
import AuthContainer from "../components/form/authcontainer";
import Divider from "../components/form/divider";
import { getDisabledStyle } from "../utils/helpers/disabledstyle";

const ForgotComponent = () => {
  const { t } = useTranslation();
  const { notifyError, notifyWarning } = useNotification();
  const [loginEmail, setLoginEmail] = useState("");
  const [validated, setValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setFrontPageMode } = useContext(StateContext);

  const handleClearForm = useCallback(() => {
    setLoginEmail("");
    setValidated(false);
  }, []);

  const handleNavigateToLogin = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setFrontPageMode("login");
    },
    [setFrontPageMode]
  );

  const handleForgotPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    const form = event.currentTarget;
    event.preventDefault();
    setValidated(true);
    if (form.checkValidity() === false) {
      return;
    }
    try {
      setIsProcessing(true);
      await requestPasswordReset(loginEmail);
      notifyWarning(
        t("auth.passwordResetSent", "Password reset email sent to {{email}}.", {
          email: loginEmail
        })
      );
    } catch (error) {
      notifyError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthContainer
      title={t("auth.forgottenPassword", "Forgotten your password?")}
      subtitle={t(
        "auth.resetInstructions",
        "Enter your email address below and we will send you a link to reset your password."
      )}
      icon="🔑"
      iconColor="secondary"
      validated={validated}
      onSubmit={handleForgotPassword}
    >
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <FloatingLabel
          controlId="formBasicEmail"
          label={t("auth.emailAddress", "Email address")}
        >
          <Form.Control
            type="email"
            placeholder={t("auth.enterEmail", "Email Address")}
            value={loginEmail}
            required
            autoFocus
            autoComplete="email"
            disabled={isProcessing}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            {t("auth.validEmailRequired", "Please enter a valid email.")}
          </Form.Control.Feedback>
        </FloatingLabel>
        <div id="email-help" className="form-text small mt-2">
          {t(
            "auth.resetEmailHelp",
            "We'll send a password reset link to this email if an account exists."
          )}
        </div>
      </Form.Group>
      <Form.Group className="text-center" controlId="formBasicButton">
        <div className="d-flex gap-2 mb-2">
          <GenericButton
            variant="primary"
            className="flex-fill"
            type="submit"
            disabled={isProcessing}
            label={
              <>
                {isProcessing && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    aria-hidden="true"
                  />
                )}{" "}
                {t("auth.continue", "Continue")}
              </>
            }
          />
          <GenericButton
            variant="outline-secondary"
            className="flex-fill"
            type="reset"
            disabled={isProcessing}
            label={t("common.clear", "Clear")}
            onClick={handleClearForm}
          />
        </div>
        <Divider text={t("auth.or", "Or")} />
        <p className="mb-0">
          {t("auth.rememberPassword", "Remember your password?")}{" "}
          <a
            href="#"
            className="link-primary text-decoration-none fw-semibold"
            onClick={handleNavigateToLogin}
            style={getDisabledStyle(isProcessing)}
          >
            {t("auth.signIn", "Sign In")}
          </a>
        </p>
      </Form.Group>
    </AuthContainer>
  );
};

export default ForgotComponent;
