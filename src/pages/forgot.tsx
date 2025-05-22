import { useContext, useRef, useState } from "react";
import { Form, Spinner, FloatingLabel } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import errorHandler from "../utils/helpers/errorhandler";
import { StateContext } from "../components/utils/context";
import { requestPasswordReset } from "../utils/pocketbase";
import GenericButton from "../components/navigation/button";

const ForgotComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [validated, setValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formRef = useRef<HTMLInputElement>(null);

  const { setFrontPageMode } = useContext(StateContext);

  const handleClearForm = () => {
    setLoginEmail("");
    setValidated(false);
  };

  const handleNavigateToLogin = () => {
    setFrontPageMode("login");
  };

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
      alert(
        t("auth.passwordResetSent", "Password reset email sent to {{email}}.", {
          email: loginEmail
        })
      );
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Form
        noValidate
        validated={validated}
        onSubmit={handleForgotPassword}
        className="responsive-width"
      >
        <Form.Group className="mb-3 text-center">
          <h1>{t("auth.forgottenPassword", "Forgotten your password?")}</h1>
        </Form.Group>
        <Form.Group className="mb-3 text-center">
          <span>
            {t(
              "auth.resetInstructions",
              "Enter your email address below and we will send you a link to reset your password."
            )}
          </span>
        </Form.Group>
        <Form.Group className="my-3" controlId="formBasicEmail">
          <FloatingLabel
            controlId="formBasicEmail"
            label={t("auth.emailAddress", "Email address")}
          >
            <Form.Control
              ref={formRef}
              type="email"
              placeholder={t("auth.enterEmail", "Email Address")}
              value={loginEmail}
              required
              onChange={(e) => {
                setLoginEmail(e.target.value);
              }}
            />
            <Form.Control.Feedback type="invalid">
              {t("auth.validEmailRequired", "Please enter a valid email.")}
            </Form.Control.Feedback>
          </FloatingLabel>
        </Form.Group>
        <Form.Group className="text-center" controlId="formBasicButton">
          <GenericButton
            variant="outline-primary"
            className="m-2"
            type="submit"
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
            variant="outline-primary"
            className="mx-2"
            type="reset"
            label={t("common.clear", "Clear")}
            onClick={handleClearForm}
          />
        </Form.Group>
        <Form.Group className="text-center" controlId="formBasicButton">
          <hr />
          <p>
            {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
            <span
              style={{ cursor: "pointer", color: "blue" }}
              onClick={handleNavigateToLogin}
            >
              {t("auth.signIn", "Sign In")}
            </span>
          </p>
        </Form.Group>
      </Form>
    </>
  );
};

export default ForgotComponent;
