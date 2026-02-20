import {
  Navbar,
  Container,
  Form,
  FloatingLabel,
  Spinner
} from "react-bootstrap";
import { useEffect, useState } from "react";
import Loader from "../components/statics/loader";
import NavBarBranding from "../components/navigation/branding";
import { MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import GenericButton from "../components/navigation/button";
import PasswordChecklist from "../components/form/passwordchecklist";
import usePasswordReset from "../hooks/usePasswordReset";

const MODE_RESET_PASSWORD = "resetPassword";
const MODE_VERIFY_EMAIL = "verifyEmail";

const UserManagementComponent = () => {
  const { t } = useTranslation();
  const [validated, setValidated] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [cloginPassword, setCloginPassword] = useState("");
  const [isLoginPasswordOk, setIsLoginPasswordOk] = useState(false);
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";

  const {
    isProcessing,
    isResetting,
    message,
    isSuccess,
    handleResetPassword: resetPassword,
    handleVerifyEmail: verifyEmail
  } = usePasswordReset();

  const resetCreationForm = () => {
    setLoginPassword("");
    setCloginPassword("");
    setValidated(false);
  };

  const handleResetPasswordSubmit = async () => {
    await resetPassword(oobCode, loginPassword, cloginPassword);
  };

  useEffect(() => {
    if (mode === MODE_VERIFY_EMAIL) {
      verifyEmail(oobCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally run on mount only
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
              handleResetPasswordSubmit();
            }}
            className="responsive-width py-3"
          >
            <Form.Group className="mb-3 text-center">
              <div className="mb-3">
                <div
                  className="icon-large icon-primary"
                  role="img"
                  aria-label={t("auth.securityIcon", "Security")}
                >
                  🔒
                </div>
              </div>
              <h1 className="h3 mb-2">
                {t("auth.resetPassword", "Reset Password")}
              </h1>
              <p className="text-muted mb-0 small">
                {t("auth.enterNewPassword", "Enter your new password below")}
              </p>
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
                  autoFocus
                  autoComplete="new-password"
                  disabled={isResetting}
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
                  autoComplete="new-password"
                  disabled={isResetting}
                />
              </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3">
              <div id="password-requirements">
                <PasswordChecklist
                  password={loginPassword}
                  passwordConfirm={cloginPassword}
                  minLength={MINIMUM_PASSWORD_LENGTH}
                  onChange={setIsLoginPasswordOk}
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
              </div>
            </Form.Group>
            <Form.Group className="text-center" controlId="formBasicButton">
              <div className="d-flex gap-2">
                <GenericButton
                  variant="primary"
                  className="flex-fill"
                  type="submit"
                  disabled={!isLoginPasswordOk || isResetting}
                  label={
                    <>
                      {isResetting && (
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          aria-hidden="true"
                        />
                      )}{" "}
                      {t("common.submit", "Submit")}
                    </>
                  }
                />
                <GenericButton
                  variant="outline-secondary"
                  className="flex-fill"
                  type="reset"
                  disabled={isResetting}
                  label={t("common.clear", "Clear")}
                  onClick={resetCreationForm}
                />
              </div>
            </Form.Group>
          </Form>
        </>
      );
      break;
    default:
      managementComponent = (
        <div className="text-center">
          <p className="text-muted">
            {t("errors.invalidRequest", "Invalid Request")}
          </p>
        </div>
      );
  }

  if (message) {
    managementComponent = (
      <div className="responsive-width py-3 text-center">
        <div className="mb-4">
          <div
            className={`icon-xlarge ${isSuccess ? "icon-success" : "icon-danger"}`}
            role="img"
          >
            {isSuccess ? "✅" : "❌"}
          </div>
          <h2 className="h4 mb-3">
            {isSuccess
              ? t("common.success", "Success!")
              : t("common.error", "Error")}
          </h2>
          <p className="text-muted mb-4">{message}</p>
        </div>
        <GenericButton
          variant="primary"
          onClick={() => (window.location.href = "/")}
          label={t("auth.backToLogin", "Back to Login")}
          className="w-100"
        />
      </div>
    );
  }

  if (isProcessing) return <Loader />;

  return (
    <div
      className="d-flex flex-column"
      style={{ minHeight: "100%", height: "100%" }}
    >
      <Navbar bg="light" className="flex-shrink-0">
        <Container fluid>
          <NavBarBranding naming="Ministry Mapper" />
        </Container>
      </Navbar>
      <Container
        fluid
        className="d-flex align-items-center justify-content-center flex-grow-1"
        style={{ overflow: "auto" }}
      >
        {managementComponent}
      </Container>
    </div>
  );
};

export default UserManagementComponent;
