import { useCallback, useContext, useEffect, useRef, useState } from "react";
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

import errorHandler from "../utils/helpers/errorhandler";
import { StateContext } from "../components/utils/context";
import GenericButton from "../components/navigation/button";
import { getAssetUrl } from "../utils/helpers/assetpath";

const LoginComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");

  const formRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const { setFrontPageMode } = useContext(StateContext);

  // Auto-focus OTP input when OTP form is shown
  useEffect(() => {
    if (otpSessionId && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSessionId]);

  const processEmail = useCallback((email: string) => {
    return email.trim().toLowerCase();
  }, []);

  const loginInWithEmailAndPassword = useCallback(
    async (email: string, password: string) => {
      const processedEmail = processEmail(email);
      try {
        setIsLogin(true);
        await authenticateEmailAndPassword(processedEmail, password);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const mfaId = err.response?.mfaId;
        setValidated(false);
        if (!mfaId) {
          errorHandler(err);
          return;
        }
        await handleOtpRequest(processedEmail);
        setMfaId(mfaId);
      } finally {
        setIsLogin(false);
      }
    },
    []
  );

  const handleOtpRequest = useCallback(async (email: string) => {
    try {
      setOtpSessionId(await requestOTP(email));
    } catch (err) {
      errorHandler(err);
    }
  }, []);

  const handleOtpSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        setIsLogin(true);
        await authenticateOTP(otpSessionId, otpCode, mfaId);
      } catch (err) {
        errorHandler(err);
      } finally {
        setIsLogin(false);
      }
    },
    [otpSessionId, otpCode, mfaId]
  );

  const handleLoginSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      event.preventDefault();
      setValidated(true);
      if (form.checkValidity() === false) {
        return;
      }
      await loginInWithEmailAndPassword(loginEmail, loginPassword);
    },
    [loginEmail, loginPassword]
  );

  const handleClipboardPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setOtpCode(text);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        alert(
          t(
            "auth.clipboardDenied",
            "Permission to access clipboard was denied."
          )
        );
        return;
      }
      errorHandler(err);
    }
  }, []);

  const handleNavigateSignup = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setFrontPageMode("signup");
    },
    []
  );

  const handleNavigateForgot = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setFrontPageMode("forgot");
    },
    []
  );

  const handleResendOtp = useCallback(async () => {
    await handleOtpRequest(processEmail(loginEmail));
    alert(t("auth.otpSentAlert", "OTP sent to your email"));
  }, [loginEmail]);

  const handleClearOtpCode = useCallback(() => {
    setOtpCode("");
  }, []);

  const handleOAuthSignIn = useCallback((provider: string) => {
    setIsOAuthLoading(true);
    authenticateOAuth2(provider)
      .catch((err) => {
        errorHandler(err);
      })
      .finally(() => {
        setIsOAuthLoading(false);
      });
  }, []);

  return (
    <>
      {!otpSessionId ? (
        <Form
          noValidate
          validated={validated}
          onSubmit={handleLoginSubmit}
          className="responsive-width"
        >
          <Form.Group className="mb-3 text-center">
            <h1>{t("auth.signIn", "Sign In")}</h1>
          </Form.Group>
          <Form.Group className="my-3" controlId="formBasicEmail">
            <FloatingLabel
              controlId="formBasicEmail"
              label={t("auth.emailAddress", "Email address")}
            >
              <Form.Control
                ref={formRef}
                type="email"
                placeholder={t("auth.enterEmail", "Enter email")}
                value={loginEmail}
                required
                disabled={isLogin || isOAuthLoading}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                }}
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
                  disabled={isLogin || isOAuthLoading}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  style={{ borderRight: "none" }}
                />
              </FloatingLabel>
              <InputGroup.Text
                onClick={() =>
                  !isLogin && !isOAuthLoading && setShowPassword(!showPassword)
                }
                style={{
                  cursor: isLogin || isOAuthLoading ? "not-allowed" : "pointer",
                  backgroundColor: "transparent",
                  borderLeft: "none",
                  opacity: isLogin || isOAuthLoading ? 0.5 : 1
                }}
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
                onClick={(e) => {
                  if (isLogin || isOAuthLoading) {
                    e.preventDefault();
                    return;
                  }
                  handleNavigateForgot(e);
                }}
                className="link-primary text-decoration-none small"
                style={{
                  pointerEvents: isLogin || isOAuthLoading ? "none" : "auto",
                  opacity: isLogin || isOAuthLoading ? 0.5 : 1
                }}
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
              disabled={isLogin || isOAuthLoading}
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
            <div className="my-4 d-flex align-items-center">
              <hr className="flex-grow-1" />
              <span className="px-3 text-muted small">
                {t("auth.orContinueWith", "Or continue with")}
              </span>
              <hr className="flex-grow-1" />
            </div>
            <div className="d-flex gap-2 mb-4">
              <GenericButton
                variant="outline-secondary"
                className="flex-fill py-2"
                type="button"
                disabled={isOAuthLoading || isLogin}
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
                onClick={(e) => {
                  if (isLogin || isOAuthLoading) {
                    e.preventDefault();
                    return;
                  }
                  handleNavigateSignup(e);
                }}
                style={{
                  pointerEvents: isLogin || isOAuthLoading ? "none" : "auto",
                  opacity: isLogin || isOAuthLoading ? 0.5 : 1
                }}
              >
                {t("auth.signUp", "Sign Up")}
              </a>
            </p>
          </Form.Group>
        </Form>
      ) : (
        <Form onSubmit={handleOtpSubmit} className="responsive-width">
          <Form.Group className="mb-4 text-center">
            <h1 className="h3 mb-3">
              {t("auth.otpVerification", "One Time Password Verification")}
            </h1>
            <p className="text-muted mb-0">
              {t("auth.otpSent", "An OTP has been sent to your email address.")}
            </p>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicOtp">
            <FloatingLabel
              controlId="formBasicOtp"
              label={t("auth.oneTimePassword", "One-time Password")}
            >
              <Form.Control
                ref={otpInputRef}
                type="text"
                placeholder={t("auth.enterOTP", "Enter OTP")}
                value={otpCode}
                required
                disabled={isLogin}
                onChange={(event) => setOtpCode(event.target.value)}
              />
            </FloatingLabel>
            <div className="text-end mt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleResendOtp();
                }}
                className="link-primary text-decoration-none small"
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
        </Form>
      )}
    </>
  );
};

export default LoginComponent;
