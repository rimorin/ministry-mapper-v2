import { useState } from "react";
import { Link, Redirect } from "wouter";
import { KeyRound } from "lucide-react";
import SubmitButton from "../components/common/submit-button";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import { useTranslation } from "react-i18next";

import { getUser } from "../utils/pocketbase";
import AuthContainer from "../components/form/authcontainer";
import EmailSent from "../components/form/email-sent";
import AuthLayout from "../components/navigation/authlayout";
import usePasswordReset from "../hooks/usePasswordReset";

const ForgotComponent = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [validated, setValidated] = useState(false);
  const [sentTo, setSentTo] = useState("");
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
    if (await handleForgotPassword(loginEmail)) setSentTo(loginEmail);
  };

  if (sentTo) {
    return (
      <AuthLayout>
        <EmailSent
          message={t(
            "auth.resetEmailSent",
            "If {{email}} has an account, we sent a link to reset the password.",
            { email: sentTo }
          )}
        >
          <Field>
            <Link href="/" replace className={buttonVariants()}>
              {t("auth.backToSignIn", "Back to sign in")}
            </Link>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSentTo("");
                setValidated(false);
              }}
            >
              {t("auth.useDifferentEmail", "Use a different email")}
            </Button>
          </Field>
        </EmailSent>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthContainer
        title={t("auth.forgottenPassword", "Forgotten your password?")}
        subtitle={t(
          "auth.resetInstructions",
          "Enter your email address below and we will send you a link to reset your password."
        )}
        icon={<KeyRound className="size-6" aria-hidden="true" />}
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
          </Field>

          <Field>
            <SubmitButton pending={isProcessing}>
              {t("auth.continue", "Continue")}
            </SubmitButton>
            <FieldDescription className="text-center">
              {t("auth.rememberPassword", "Remember your password?")}{" "}
              <Link href="/" replace>
                {t("auth.signIn", "Sign in")}
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </AuthContainer>
    </AuthLayout>
  );
};

export default ForgotComponent;
