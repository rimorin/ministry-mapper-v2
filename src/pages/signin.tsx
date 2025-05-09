import { useCallback, useContext, useRef, useState } from "react";
import { Form, Button, Spinner, FloatingLabel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  authenticateEmailAndPassword,
  authenticateOTP,
  requestOTP
} from "../utils/pocketbase";

import errorHandler from "../utils/helpers/errorhandler";
import { StateContext } from "../components/utils/context";

const LoginComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [validated, setValidated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");

  const formRef = useRef<HTMLInputElement>(null);

  const { setFrontPageMode } = useContext(StateContext);

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
      if (err instanceof Error) {
        // Ignore the error if the user aborts the share
        if (err.name === "NotAllowedError") {
          alert(
            t(
              "auth.clipboardDenied",
              "Permission to access clipboard was denied."
            )
          );
          return;
        }
      }
      errorHandler(err);
    }
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
            <Form.Control.Feedback>
              {t("auth.looksGood", "Looks Good!")}
            </Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              {t("auth.enterPassword", "Please enter password.")}
            </Form.Control.Feedback>
            <div className="text-end">
              <Form.Text
                onClick={() => setFrontPageMode("forgot")}
                className="text-underline"
                muted
              >
                {t("auth.forgotPassword", "Forgot Password?")}
              </Form.Text>
            </div>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <Button
              variant="outline-primary"
              className="m-2"
              type="submit"
              disabled={isLogin}
            >
              {isLogin && (
                <>
                  <Spinner size="sm" />{" "}
                </>
              )}
              {t("auth.signIn", "Sign In")}
            </Button>
            <Button
              className="mx-2"
              variant="outline-primary"
              type="reset"
              onClick={() => {
                setLoginPassword("");
                setLoginEmail("");
                setOtpCode("");
                setValidated(false);
              }}
            >
              {t("common.clear", "Clear")}
            </Button>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <hr />
            <p>
              {t("auth.noAccountQuestion", "Don't have an account?")}{" "}
              <span
                style={{ cursor: "pointer", color: "blue" }}
                onClick={() => setFrontPageMode("signup")}
              >
                {t("auth.signUp", "Sign Up")}
              </span>
            </p>
          </Form.Group>
        </Form>
      ) : (
        <Form onSubmit={handleOtpSubmit} className="responsive-width">
          <Form.Group className="mb-3 text-center">
            <h1>
              {t("auth.otpVerification", "One Time Password Verification")}
            </h1>
            <p className="text-muted">
              {t("auth.otpSent", "An OTP has been sent to your email address.")}
            </p>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicOtp">
            <FloatingLabel
              controlId="formBasicPassword"
              label={t("auth.oneTimePassword", "One-time Password")}
            >
              <Form.Control
                type="text"
                placeholder={t("auth.enterOTP", "Enter OTP")}
                value={otpCode}
                required
                onChange={(event) => setOtpCode(event.target.value)}
              />
            </FloatingLabel>
            <div className="text-end">
              <Form.Text
                onClick={async () => {
                  await handleOtpRequest(processEmail(loginEmail));
                  alert(t("auth.otpSentAlert", "OTP sent to your email"));
                }}
                className="text-underline"
                muted
              >
                {t("auth.resendOTP", "Resend OTP")}
              </Form.Text>
            </div>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <Button
              variant="outline-primary"
              className="m-2"
              type="submit"
              disabled={isLogin}
            >
              {isLogin && (
                <>
                  <Spinner size="sm" />{" "}
                </>
              )}
              {t("auth.verify", "Verify")}
            </Button>
            {navigator.clipboard && (
              <Button
                className="mx-2"
                variant="outline-primary"
                type="button"
                onClick={handleClipboardPaste}
              >
                {t("auth.paste", "Paste")}
              </Button>
            )}
            <Button
              className="mx-2"
              variant="outline-primary"
              type="reset"
              onClick={() => setOtpCode("")}
            >
              {t("common.clear", "Clear")}
            </Button>
          </Form.Group>
        </Form>
      )}
    </>
  );
};

export default LoginComponent;
