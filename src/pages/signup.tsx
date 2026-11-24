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
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link, Redirect, useLocation } from "wouter";

import { MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { getUser } from "../utils/pocketbase";
import AuthContainer from "../components/form/authcontainer";
import OAuthButtons from "../components/form/oauth-buttons";
import AuthLayout from "../components/navigation/authlayout";
import PasswordChecklist from "../components/form/passwordchecklist";
import useAuthentication from "../hooks/useAuthentication";
import useSignup from "../hooks/useSignup";

const { VITE_PRIVACY_URL, VITE_TERMS_URL } = import.meta.env;

// What a name may be, for the input's own check and for knowing when to
// say so: starts with a letter, 2 to 50 characters.
const NAME_PATTERN = "[A-Za-z][\\w\\s.\\-']*";
const NAME_REGEX = new RegExp(`^(?=.{2,50}$)${NAME_PATTERN}$`);

const SignupComponent = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [nameTouched, setNameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
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

  const isBusy = isCreating || isOAuthLoading;
  const isNameValid = NAME_REGEX.test(formData.name);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setValidated(true);
    if (!form.checkValidity()) {
      return;
    }
    await handleCreateSubmit(() => navigate("/", { replace: true }));
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
          {/* The one-tap ways in come first here too: they make the account
              with no form to fill and no email to verify. */}
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
            {/* Says what the button is waiting for before anything is typed;
                the checklist takes over once it is. */}
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
