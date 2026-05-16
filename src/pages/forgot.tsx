import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import { getUser } from "../utils/pocketbase";
import AuthContainer from "../components/form/authcontainer";
import AuthLayout from "../components/navigation/authlayout";
import Divider from "../components/form/divider";
import usePasswordReset from "../hooks/usePasswordReset";

const ForgotComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [validated, setValidated] = useState(false);
  const [, navigate] = useLocation();
  const { isProcessing, handleForgotPassword } = usePasswordReset();

  if (getUser()) return <Redirect to="/" />;

  const handleSubmitForgotPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    const form = event.currentTarget;
    event.preventDefault();
    setValidated(true);
    if (!form.checkValidity()) {
      return;
    }
    await handleForgotPassword(loginEmail);
  };

  return (
    <AuthLayout>
      <AuthContainer
        title={t("auth.forgottenPassword", "Forgotten your password?")}
        subtitle={t(
          "auth.resetInstructions",
          "Enter your email address below and we will send you a link to reset your password."
        )}
        icon="🔑"
        iconColor="secondary"
        validated={validated}
        onSubmit={handleSubmitForgotPassword}
      >
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">
            {t("auth.emailAddress", "Email address")}
          </Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder={t("auth.enterEmail", "Email Address")}
            value={loginEmail}
            required
            aria-required="true"
            autoFocus
            autoComplete="email"
            disabled={isProcessing}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <p id="email-help" className="text-xs text-muted-foreground">
            {t(
              "auth.resetEmailHelp",
              "We'll send a password reset link to this email if an account exists."
            )}
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isProcessing}>
          {isProcessing && (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          )}
          {t("auth.continue", "Continue")}
        </Button>

        <Divider text={t("auth.or", "Or")} />

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.rememberPassword", "Remember your password?")}{" "}
          <Button
            variant="link"
            className="h-auto p-0 font-semibold"
            disabled={isProcessing}
            onClick={() => navigate("/", { replace: true })}
          >
            {t("auth.signIn", "Sign In")}
          </Button>
        </p>
      </AuthContainer>
    </AuthLayout>
  );
};

export default ForgotComponent;
