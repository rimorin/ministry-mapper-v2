import { useContext, useEffect, useRef, useState } from "react";
import {
  Form,
  Spinner,
  FloatingLabel,
  Image,
  InputGroup
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  authenticateEmailAndPassword,
  authenticateOTP,
  authenticateOAuth2,
  requestOTP
} from "../utils/pocketbase";

import useNotification from "../hooks/useNotification";
import { StateContext } from "../components/utils/context";
import GenericButton from "../components/navigation/button";
import { getAssetUrl } from "../utils/helpers/assetpath";
import AuthContainer from "../components/form/authcontainer";
import Divider from "../components/form/divider";
import { getDisabledStyle } from "../utils/helpers/disabledstyle";

const LoginComponent = () => {
  const { t } = useTranslation();
  const { notifyError, notifyWarning, notifyInfo } = useNotification();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");

  const otpInputRef = useRef<HTMLInputElement>(null);

  const { setFrontPageMode } = useContext(StateContext);

  // Auto-focus OTP input when OTP form is shown
  useEffect(() => {
    if (otpSessionId && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSessionId]);

  const processEmail = (email: string) => email.trim().toLowerCase();

  const handleOtpRequest = async (email: string) => {
    try {
      setOtpSessionId(await requestOTP(email));
    } catch (err) {
      notifyError(err);
    }
  };

  const loginInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    const processedEmail = processEmail(email);
    try {
      setIsLogin(true);
      await authenticateEmailAndPassword(processedEmail, password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const mfaId = err.response?.mfaId;
      setValidated(false);
      if (!mfaId) {
        notifyError(err);
        return;
      }
      await handleOtpRequest(processedEmail);
      setMfaId(mfaId);
    } finally {
      setIsLogin(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLogin(true);
      await authenticateOTP(otpSessionId, otpCode, mfaId);
    } catch (err) {
      notifyError(err);
    } finally {
      setIsLogin(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    setValidated(true);
    if (form.checkValidity() === false) {
      return;
    }
    await loginInWithEmailAndPassword(loginEmail, loginPassword);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setOtpCode(text);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        notifyWarning(
          t(
            "auth.clipboardDenied",
            "Permission to access clipboard was denied."
          )
        );
        return;
      }
      notifyError(err);
    }
  };

  const handleNavigateSignup = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setFrontPageMode("signup");
  };

  const handleNavigateForgot = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setFrontPageMode("forgot");
  };

  const handleResendOtp = async () => {
    await handleOtpRequest(processEmail(loginEmail));
    notifyInfo(t("auth.otpSentAlert", "OTP sent to your email"));
  };

  const handleClearOtpCode = () => {
    setOtpCode("");
  };

  const handleOAuthSignIn = (provider: string) => {
    setIsOAuthLoading(true);
    authenticateOAuth2(provider)
      .catch((err) => {
        notifyError(err);
      })
      .finally(() => {
        setIsOAuthLoading(false);
      });
  };

  const isDisabled = isLogin || isOAuthLoading;

  return (
    <>
      {!otpSessionId ? (
        <AuthContainer
          title={t("auth.signIn", "Sign In")}
          subtitle={t(
            "auth.signInWelcome",
            "Welcome back! Please enter your credentials."
          )}
          validated={validated}
          onSubmit={handleLoginSubmit}
        >
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <FloatingLabel
              controlId="formBasicEmail"
              label={t("auth.emailAddress", "Email address")}
            >
              <Form.Control
                type="email"
                placeholder={t("auth.enterEmail", "Enter email")}
                value={loginEmail}
                required
                autoComplete="email"
                autoFocus
                disabled={isDisabled}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <Form.Control.Feedback type="invalid">
                {t("auth.validEmailRequired", "Please enter a valid email.")}
              </Form.Control.Feedback>
            </FloatingLabel>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <InputGroup>
              <FloatingLabel
                controlId="formBasicPassword"
                label={t("auth.password", "Password")}
                className="flex-grow-1"
              >
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password", "Password")}
                  value={loginPassword}
                  required
                  autoComplete="current-password"
                  disabled={isDisabled}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  style={{ borderRight: "none" }}
                />
              </FloatingLabel>
              <InputGroup.Text
                onClick={() => !isDisabled && setShowPassword(!showPassword)}
                tabIndex={0}
                role="button"
                aria-label={
                  showPassword
                    ? t("auth.hidePassword", "Hide password")
                    : t("auth.showPassword", "Show password")
                }
                className={`password-toggle ${isDisabled ? "disabled" : ""}`}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </InputGroup.Text>
            </InputGroup>
            <Form.Control.Feedback>
              {t("auth.looksGood", "Looks Good!")}
            </Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              {t("auth.enterPassword", "Please enter password.")}
            </Form.Control.Feedback>
            <div className="text-end mt-2">
              <a
                href="#"
                onClick={handleNavigateForgot}
                className="link-primary text-decoration-none small"
                style={getDisabledStyle(isDisabled)}
              >
                {t("auth.forgotPassword", "Forgot Password?")}
              </a>
            </div>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <GenericButton
              variant="primary"
              className="w-100 mb-3"
              type="submit"
              disabled={isDisabled}
              label={
                <>
                  {isLogin && (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      aria-hidden="true"
                    />
                  )}{" "}
                  {t("auth.signIn", "Sign In")}
                </>
              }
            />
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <Divider text={t("auth.orContinueWith", "Or continue with")} />
            <div className="d-flex gap-2 mb-4">
              <GenericButton
                variant="outline-secondary"
                className="flex-fill py-2"
                type="button"
                disabled={isDisabled}
                onClick={() => handleOAuthSignIn("google")}
                label={
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    {isOAuthLoading ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        aria-hidden="true"
                      />
                    ) : (
                      <Image
                        src={getAssetUrl("google.svg")}
                        alt="Google logo"
                        width="20"
                        height="20"
                      />
                    )}
                    <span>
                      {isOAuthLoading
                        ? t("auth.signingIn", "Signing in...")
                        : t("auth.signInWithGoogle", "Sign in with Google")}
                    </span>
                  </div>
                }
              />
            </div>
            <p className="mb-0">
              {t("auth.noAccountQuestion", "Don't have an account?")}{" "}
              <a
                href="#"
                className="link-primary text-decoration-none fw-semibold"
                onClick={handleNavigateSignup}
                style={getDisabledStyle(isDisabled)}
              >
                {t("auth.signUp", "Sign Up")}
              </a>
            </p>
          </Form.Group>
        </AuthContainer>
      ) : (
        <AuthContainer
          title={t("auth.otpVerification", "One Time Password Verification")}
          subtitle={t(
            "auth.otpSent",
            "An OTP has been sent to your email address."
          )}
          icon="🔒"
          onSubmit={handleOtpSubmit}
        >
          <p className="text-center text-muted mb-3 small">
            <strong>{loginEmail}</strong>
          </p>
          <Form.Group className="mb-3" controlId="formBasicOtp">
            <FloatingLabel
              controlId="formBasicOtp"
              label={t("auth.oneTimePassword", "One-time Password")}
            >
              <Form.Control
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={t("auth.enterOTP", "Enter OTP")}
                value={otpCode}
                required
                disabled={isLogin}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  setOtpCode(value);
                }}
                className="otp-input"
              />
            </FloatingLabel>
            <div id="otp-help" className="form-text text-center mt-2">
              {t("auth.otpHelp", "Enter the 4-digit code sent to your email")}
            </div>
            <div className="text-center mt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLogin) handleResendOtp();
                }}
                className="link-primary text-decoration-none small"
                style={getDisabledStyle(isLogin)}
              >
                {t("auth.resendOTP", "Resend OTP")}
              </a>
            </div>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <GenericButton
              variant="primary"
              className="w-100 mb-2"
              type="submit"
              disabled={isLogin}
              label={
                <>
                  {isLogin && (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      aria-hidden="true"
                    />
                  )}{" "}
                  {t("auth.verify", "Verify")}
                </>
              }
            />
            <div className="d-flex gap-2">
              {navigator.clipboard && (
                <GenericButton
                  className="flex-fill"
                  variant="outline-secondary"
                  label={t("auth.paste", "Paste")}
                  onClick={handleClipboardPaste}
                  disabled={isLogin}
                />
              )}
              <GenericButton
                className="flex-fill"
                variant="outline-secondary"
                type="reset"
                label={t("common.clear", "Clear")}
                onClick={handleClearOtpCode}
                disabled={isLogin}
              />
            </div>
          </Form.Group>
        </AuthContainer>
      )}
    </>
  );
};

export default LoginComponent;
