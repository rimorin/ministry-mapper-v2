import { useState } from "react";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import AuthContainer from "../components/form/authcontainer";
import OAuthButtons from "../components/form/oauth-buttons";
import useAuthentication from "../hooks/useAuthentication";

// The emailed code's length, as the backend issues it.
const OTP_LENGTH = 4;

const LoginComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);

  const {
    isLogin,
    isOAuthLoading,
    oauthProvider,
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

  const handleBackToSignIn = () => {
    clearOtpState();
    setValidated(false);
  };

  const isDisabled = isLogin || isOAuthLoading;

  return (
    <>
      {!otpSessionId ? (
        <AuthContainer
          title={t("auth.signIn", "Sign in")}
          subtitle={t("auth.signInWelcome", "Welcome! Choose how to sign in.")}
          validated={validated}
          onSubmit={handleLoginSubmit}
        >
          <FieldGroup className="gap-5">
            {/* The one-tap ways in come first: someone new has no password to
                type, and these make the account as well as open it. */}
            <Field>
              <OAuthButtons
                disabled={isDisabled}
                pendingProvider={isOAuthLoading ? oauthProvider : ""}
                onSignIn={handleOAuthSignIn}
              />
            </Field>

            <FieldSeparator className="sm:*:data-[slot=field-separator-content]:bg-card">
              {t("auth.orUseEmail", "Or use your email")}
            </FieldSeparator>

            <Field>
              <FieldLabel htmlFor="login-email">
                {t("auth.emailAddress", "Email address")}
              </FieldLabel>
              <Input
                id="login-email"
                type="email"
                placeholder={t("auth.enterEmail", "Enter email")}
                value={loginEmail}
                required
                aria-required="true"
                autoComplete="email"
                disabled={isDisabled}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </Field>

            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="login-password">
                  {t("auth.password", "Password")}
                </FieldLabel>
                <Link
                  href="/forgot"
                  className="ml-auto text-sm underline underline-offset-4"
                >
                  {t("auth.forgotPassword", "Forgot password?")}
                </Link>
              </div>
              <InputGroup>
                <InputGroupInput
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password", "Password")}
                  value={loginPassword}
                  required
                  aria-required="true"
                  autoComplete="current-password"
                  disabled={isDisabled}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? t("auth.hidePassword", "Hide password")
                        : t("auth.showPassword", "Show password")
                    }
                    disabled={isDisabled}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <Button type="submit" disabled={isDisabled}>
                {isLogin && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t("auth.signIn", "Sign in")}
              </Button>
              <FieldDescription className="text-center">
                {t("auth.noAccountQuestion", "Don't have an account?")}{" "}
                <Link href="/signup">{t("auth.signUp", "Sign up")}</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </AuthContainer>
      ) : (
        <AuthContainer
          title={t("auth.otpVerification", "Check your email")}
          subtitle={t("auth.otpSent", "We sent a 4-digit code to {{email}}.", {
            email: loginEmail
          })}
          icon={<Mail className="size-6" aria-hidden="true" />}
          onSubmit={handleOtpFormSubmit}
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="otp-code" className="sr-only">
                {t("auth.oneTimePassword", "One-time code")}
              </FieldLabel>
              {/* The last digit sends the code, so nobody has to find a
                  button; Verify stays for anyone who wants it. */}
              <InputOTP
                id="otp-code"
                maxLength={OTP_LENGTH}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
                onComplete={(code: string) => submitOtp(otpSessionId, code)}
                disabled={isLogin}
                autoFocus
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </Field>

            <Field>
              <Button
                type="submit"
                disabled={isLogin || otpCode.length < OTP_LENGTH}
              >
                {isLogin && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t("auth.verify", "Verify")}
              </Button>
              <FieldDescription className="text-center">
                {t("auth.noCode", "Didn't get it?")}{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 underline"
                  disabled={isLogin}
                  onClick={() => handleResendOtp(loginEmail)}
                >
                  {t("auth.resendOTP", "Send a new code")}
                </Button>
              </FieldDescription>
            </Field>

            <Button
              variant="link"
              className="h-auto self-center p-0 text-muted-foreground hover:text-foreground"
              disabled={isLogin}
              onClick={handleBackToSignIn}
            >
              {t("auth.backToSignIn", "Back to sign in")}
            </Button>
          </FieldGroup>
        </AuthContainer>
      )}
    </>
  );
};

export default LoginComponent;
