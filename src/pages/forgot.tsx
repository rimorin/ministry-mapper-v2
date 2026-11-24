import { useState } from "react";
import { Link, Redirect } from "wouter";
import SubmitButton from "../components/common/submit-button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from "@/components/ui/field";
import { useTranslation } from "react-i18next";

import { getUser } from "../utils/pocketbase";
import AuthContainer from "../components/form/authcontainer";
import AuthLayout from "../components/navigation/authlayout";
import usePasswordReset from "../hooks/usePasswordReset";

const ForgotComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [validated, setValidated] = useState(false);
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
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="forgot-email">
              {t("auth.emailAddress", "Email address")}
            </FieldLabel>
            <Input
              id="forgot-email"
              type="email"
              placeholder={t("auth.enterEmail", "Enter email")}
              value={loginEmail}
              required
              aria-required="true"
              autoFocus
              autoComplete="email"
              disabled={isProcessing}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <FieldDescription id="email-help">
              {t(
                "auth.resetEmailHelp",
                "We'll send a password reset link to this email if an account exists."
              )}
            </FieldDescription>
          </Field>

          <Field>
            <SubmitButton pending={isProcessing}>
              {t("auth.continue", "Continue")}
            </SubmitButton>
          </Field>

          <FieldSeparator className="sm:*:data-[slot=field-separator-content]:bg-card">
            {t("auth.or", "Or")}
          </FieldSeparator>

          <FieldDescription className="text-center">
            {t("auth.rememberPassword", "Remember your password?")}{" "}
            <Link href="/" replace>
              {t("auth.signIn", "Sign in")}
            </Link>
          </FieldDescription>
        </FieldGroup>
      </AuthContainer>
    </AuthLayout>
  );
};

export default ForgotComponent;
