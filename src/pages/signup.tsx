import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link, Redirect } from "wouter";

import { MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { getUser } from "../utils/pocketbase";
import AuthContainer from "../components/form/authcontainer";
import EmailSent from "../components/form/email-sent";
import OAuthButtons from "../components/form/oauth-buttons";
import AuthLayout from "../components/navigation/authlayout";
import PasswordChecklist from "../components/form/passwordchecklist";
import useAuthentication from "../hooks/useAuthentication";
import useSignup from "../hooks/useSignup";

const { VITE_PRIVACY_URL, VITE_TERMS_URL } = import.meta.env;

const NAME_PATTERN = "[A-Za-z][\\w\\s.\\-']*";
const NAME_REGEX = new RegExp(`^(?=.{2,50}$)${NAME_PATTERN}$`);

const SignupComponent = () => {
  const { t } = useTranslation();
  const [nameTouched, setNameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const {
    formData,
    validated,
    setValidated,
    isPasswordValid,
    setIsPasswordValid,
    isCreating,
    handleInputChange,
    handleCreateSubmit
  } = useSignup();

  const { isOAuthLoading, oauthProvider, handleOAuthSignIn } =
    useAuthentication();

  if (getUser()) return <Redirect to="/" />;

  if (sentTo) {
    return (
      <AuthLayout>
        <EmailSent
          message={t(
            "auth.signupEmailSent",
            "We sent a link to {{email}}. Open it to verify your account, then sign in.",
            { email: sentTo }
          )}
        >
          <Field>
            <Link href="/" replace className={buttonVariants()}>
              {t("auth.backToSignIn", "Back to sign in")}
            </Link>
          </Field>
        </EmailSent>
      </AuthLayout>
    );
  }

  const isBusy = isCreating || isOAuthLoading;
  const isNameValid = NAME_REGEX.test(formData.name);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setValidated(true);
    if (!form.checkValidity()) {
      return;
    }
    await handleCreateSubmit(() => setSentTo(formData.email));
  };

  return (
    <AuthLayout>
      <AuthContainer
        title={t("auth.signUp", "Sign up")}
        subtitle={t("auth.createAccount", "Create your account to get started")}
        validated={validated}
        onSubmit={handleFormSubmit}
      >
        <FieldGroup className="gap-5">
          <Field>
            <OAuthButtons
              disabled={isBusy}
              pendingProvider={isOAuthLoading ? oauthProvider : ""}
              onSignIn={handleOAuthSignIn}
            />
          </Field>

          <FieldSeparator className="sm:*:data-[slot=field-separator-content]:bg-card">
            {t("auth.orUseEmail", "Or use your email")}
          </FieldSeparator>

          <Field>
            <FieldLabel htmlFor="name">{t("auth.name", "Name")}</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder={t("auth.enterName", "Enter name")}
              value={formData.name}
              required
              aria-required="true"
              minLength={2}
              maxLength={50}
              pattern={NAME_PATTERN}
              autoComplete="name"
              disabled={isBusy}
              onChange={handleInputChange}
              onBlur={() => setNameTouched(true)}
            />
            {(nameTouched || validated) && !isNameValid && (
              <FieldDescription>
                {t(
                  "auth.nameHelp",
                  "Must start with a letter. Letters, numbers, spaces, hyphens, and periods allowed."
                )}
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">
              {t("auth.emailAddress", "Email address")}
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.enterEmail", "Enter email")}
              value={formData.email}
              required
              aria-required="true"
              autoComplete="email"
              disabled={isBusy}
              onChange={handleInputChange}
            />
            <FieldDescription id="email-help">
              {t(
                "auth.emailHelp",
                "We'll send a verification link to this email."
              )}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">
              {t("auth.password", "Password")}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder={t("auth.password", "Password")}
              value={formData.password}
              required
              aria-required="true"
              autoComplete="new-password"
              disabled={isBusy}
              onChange={(e) => {
                setPasswordTouched(true);
                handleInputChange(e);
              }}
            />
            {!(passwordTouched || validated) && (
              <FieldDescription>
                {t(
                  "auth.passwordHelp",
                  "At least {{length}} characters, with a number and a capital letter.",
                  { length: MINIMUM_PASSWORD_LENGTH }
                )}
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("auth.confirmPassword", "Confirm password")}
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("auth.confirmPassword", "Confirm password")}
              value={formData.confirmPassword}
              required
              aria-required="true"
              autoComplete="new-password"
              disabled={isBusy}
              onChange={handleInputChange}
            />
          </Field>

          {(passwordTouched || validated) && (
            <PasswordChecklist
              password={formData.password}
              passwordConfirm={formData.confirmPassword}
              minLength={MINIMUM_PASSWORD_LENGTH}
              onChange={setIsPasswordValid}
              messages={{
                minLength: t(
                  "password.minLength",
                  "Password must be at least {{length}} characters long.",
                  { length: MINIMUM_PASSWORD_LENGTH }
                ),
                number: t("password.number", "Password must contain numbers."),
                capital: t(
                  "password.capital",
                  "Password must contain uppercase letters."
                ),
                match: t("password.match", "Passwords must match.")
              }}
            />
          )}

          <Field>
            <Button type="submit" disabled={!isPasswordValid || isBusy}>
              {isCreating && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("auth.signUp", "Sign up")}
            </Button>
            <FieldDescription className="text-center">
              {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
              <Link href="/" replace>
                {t("auth.signIn", "Sign in")}
              </Link>
            </FieldDescription>
          </Field>

          <FieldDescription className="text-center text-xs">
            {t("auth.termsAgreement", "By signing up, you agree to our")}{" "}
            <a
              href={VITE_PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("auth.privacyPolicy", "privacy policy")}
            </a>{" "}
            {t("auth.andOur", "and our")}{" "}
            <a href={VITE_TERMS_URL} target="_blank" rel="noopener noreferrer">
              {t("auth.termsOfService", "terms of service")}
            </a>
            .
          </FieldDescription>
        </FieldGroup>
      </AuthContainer>
    </AuthLayout>
  );
};

export default SignupComponent;
