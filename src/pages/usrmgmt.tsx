import {
  Navbar,
  Container,
  Button,
  Form,
  FloatingLabel,
  Spinner
} from "react-bootstrap";
import { useCallback, useEffect, useState } from "react";
import Loader from "../components/statics/loader";
import NavBarBranding from "../components/navigation/branding";
import { PASSWORD_POLICY, MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import PasswordChecklist from "react-password-checklist";
import { confirmPasswordReset, confirmVerification } from "../utils/pocketbase";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";

const MODE_RESET_PASSWORD = "resetPassword";
const MODE_VERIFY_EMAIL = "verifyEmail";

const UserManagementComponent = () => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [message, setMessage] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cloginPassword, setCloginPassword] = useState("");
  const [isLoginPasswordOk, setIsLoginPasswordOk] = useState(false);
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";

  const handleResetPassword = useCallback(
    async (actionCode: string): Promise<void> => {
      try {
        setIsResetting(true);
        await confirmPasswordReset(actionCode, loginPassword, cloginPassword);
        setMessage(
          t(
            "auth.passwordResetSuccess",
            "Your password has been successfully reset."
          )
        );
      } catch (error) {
        setMessage(JSON.stringify(error));
      } finally {
        setIsResetting(false);
      }
    },
    [loginPassword, cloginPassword]
  );

  const handleVerifyEmail = useCallback(
    async (actionCode: string): Promise<void> => {
      try {
        setIsProcessing(true);
        await confirmVerification(actionCode);
        setMessage(
          t(
            "auth.emailVerificationSuccess",
            "Your email address has been verified."
          )
        );
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : JSON.stringify(error)
        );
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const resetCreationForm = () => {
    setLoginPassword("");
    setCloginPassword("");
    setValidated(false);
  };

  useEffect(() => {
    if (mode === MODE_VERIFY_EMAIL) {
      handleVerifyEmail(oobCode);
    }
  }, []);

  let managementComponent;
  switch (mode) {
    case MODE_RESET_PASSWORD:
      managementComponent = (
        <>
          <Form
            noValidate
            validated={validated}
            onSubmit={(event) => {
              event.preventDefault();
              handleResetPassword(oobCode);
            }}
            className="responsive-width"
          >
            <Form.Group className="mb-3 text-center">
              <h1>{t("auth.resetPassword", "Reset Password")}</h1>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <FloatingLabel
                controlId="formBasicPassword"
                label={t("auth.password", "Password")}
              >
                <Form.Control
                  type="password"
                  placeholder={t("auth.password", "Password")}
                  value={loginPassword}
                  required
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
              <FloatingLabel
                controlId="formBasicConfirmPassword"
                label={t("auth.confirmPassword", "Confirm Password")}
              >
                <Form.Control
                  type="password"
                  placeholder={t("auth.confirmPassword", "Confirm Password")}
                  value={cloginPassword}
                  onChange={(event) => setCloginPassword(event.target.value)}
                  required
                />
              </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3">
              <PasswordChecklist
                rules={PASSWORD_POLICY}
                minLength={MINIMUM_PASSWORD_LENGTH}
                value={loginPassword}
                valueAgain={cloginPassword}
                onChange={(isValid) => setIsLoginPasswordOk(isValid)}
                messages={{
                  minLength: t(
                    "password.minLength",
                    "Password must be at least {{length}} characters long.",
                    { length: MINIMUM_PASSWORD_LENGTH }
                  ),
                  number: t(
                    "password.number",
                    "Password must contain numbers."
                  ),
                  capital: t(
                    "password.capital",
                    "Password must contain uppercase letters."
                  ),
                  match: t("password.match", "Passwords must match.")
                }}
              />
            </Form.Group>
            <Form.Group className="text-center" controlId="formBasicButton">
              <Button
                variant="primary"
                type="submit"
                disabled={!isLoginPasswordOk}
              >
                {isResetting && (
                  <>
                    <Spinner size="sm" />{" "}
                  </>
                )}
                {t("common.submit", "Submit")}
              </Button>
              <Button
                className="mx-2"
                variant="outline-primary"
                type="reset"
                onClick={() => resetCreationForm()}
              >
                {t("common.clear", "Clear")}
              </Button>
            </Form.Group>
          </Form>
        </>
      );
      break;
    default:
      managementComponent = (
        <div>{t("errors.invalidRequest", "Invalid Request")}</div>
      );
  }

  if (message) {
    managementComponent = (
      <div
        className="d-flex flex-column justify-content-between"
        style={{ height: "100%" }}
      >
        <div className="fluid-bolding mb-3">{message}</div>
      </div>
    );
  }

  if (isProcessing) return <Loader />;
  return (
    <>
      <div className="d-flex flex-column" style={{ minHeight: "99vh" }}>
        <Navbar bg="light">
          <Container fluid>
            <NavBarBranding naming="" />
          </Container>
        </Navbar>
        <Container
          fluid
          className="d-flex align-items-center justify-content-center"
          style={{ flexGrow: 1 }}
        >
          {managementComponent}
        </Container>
      </div>
    </>
  );
};

export default UserManagementComponent;
