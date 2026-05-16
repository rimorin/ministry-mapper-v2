import { useState } from "react";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getAssetUrl } from "../utils/helpers/assetpath";
import AuthContainer from "../components/form/authcontainer";
import Divider from "../components/form/divider";
import useAuthentication from "../hooks/useAuthentication";
import useNotification from "../hooks/useNotification";

const LoginComponent = () => {
  const { t } = useTranslation();
  const { notifyWarning } = useNotification();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);

  const [, navigate] = useLocation();

  const {
    isLogin,
    isOAuthLoading,
    otpSessionId,
    otpCode,
    setOtpCode,
    loginInWithEmailAndPassword,
    handleOtpSubmit: submitOtp,
    handleResendOtp,
    handleOAuthSignIn,
    clearOtpState
  } = useAuthentication();

  const handleOtpFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await submitOtp(otpSessionId, otpCode);
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    setValidated(false);
    requestAnimationFrame(() => setValidated(true));
    if (!form.checkValidity()) return;
    await loginInWithEmailAndPassword(loginEmail, loginPassword);
  };

  const isClipboardAvailable = "clipboard" in navigator;

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
      notifyWarning(String(err));
    }
  };

  const handleBackToSignIn = () => {
    clearOtpState();
    setValidated(false);
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
          <div className="space-y-1.5">
            <Label htmlFor="login-email">
              {t("auth.emailAddress", "Email address")}
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder={t("auth.enterEmail", "Enter email")}
              value={loginEmail}
              required
              aria-required="true"
              autoComplete="email"
              autoFocus
              disabled={isDisabled}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">
              {t("auth.password", "Password")}
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.password", "Password")}
                value={loginPassword}
                required
                aria-required="true"
                autoComplete="current-password"
                disabled={isDisabled}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? t("auth.hidePassword", "Hide password")
                    : t("auth.showPassword", "Show password")
                }
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isDisabled}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            <div className="text-right">
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                disabled={isDisabled}
                onClick={() => navigate("/forgot")}
              >
                {t("auth.forgotPassword", "Forgot Password?")}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isDisabled}>
            {isLogin && <Spinner data-icon="inline-start" aria-hidden="true" />}
            {t("auth.signIn", "Sign In")}
          </Button>

          <Divider text={t("auth.orContinueWith", "Or continue with")} />
          <Button
            variant="outline"
            type="button"
            className="w-full gap-2"
            disabled={isDisabled}
            onClick={() => handleOAuthSignIn("google")}
          >
            {isOAuthLoading ? (
              <Spinner aria-hidden="true" />
            ) : (
              <img
                src={getAssetUrl("google.svg")}
                alt="Google logo"
                width="18"
                height="18"
              />
            )}
            {isOAuthLoading
              ? t("auth.signingIn", "Signing in...")
              : t("auth.signInWithGoogle", "Sign in with Google")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccountQuestion", "Don't have an account?")}{" "}
            <Button
              variant="link"
              className="h-auto p-0 font-semibold"
              disabled={isDisabled}
              onClick={() => navigate("/signup")}
            >
              {t("auth.signUp", "Sign Up")}
            </Button>
          </p>
        </AuthContainer>
      ) : (
        <AuthContainer
          title={t("auth.otpVerification", "One Time Password Verification")}
          subtitle={t(
            "auth.otpSent",
            "An OTP has been sent to your email address."
          )}
          icon="🔒"
          onSubmit={handleOtpFormSubmit}
        >
          <p className="text-center text-sm font-medium text-muted-foreground">
            {loginEmail}
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="otp-code" className="sr-only">
              {t("auth.oneTimePassword", "One-time Password")}
            </Label>
            <div className="flex flex-col items-center gap-3">
              <InputOTP
                id="otp-code"
                maxLength={4}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
                disabled={isLogin}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <p
                id="otp-help"
                className="text-center text-xs text-muted-foreground"
              >
                {t("auth.otpHelp", "Enter the 4-digit code sent to your email")}
              </p>
            </div>
            <div className="text-center">
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                disabled={isLogin}
                onClick={() => handleResendOtp(loginEmail)}
              >
                {t("auth.resendOTP", "Resend OTP")}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLogin}>
            {isLogin && <Spinner data-icon="inline-start" aria-hidden="true" />}
            {t("auth.verify", "Verify")}
          </Button>

          <div className="flex gap-2">
            {isClipboardAvailable && (
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={handleClipboardPaste}
                disabled={isLogin}
              >
                {t("auth.paste", "Paste")}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              type="reset"
              onClick={() => setOtpCode("")}
              disabled={isLogin}
            >
              {t("common.clear", "Clear")}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
              disabled={isLogin}
              onClick={handleBackToSignIn}
            >
              {t("auth.backToSignIn", "Back to Sign In")}
            </Button>
          </div>
        </AuthContainer>
      )}
    </>
  );
};

export default LoginComponent;
