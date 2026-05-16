import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Redirect, useLocation } from "wouter";

import { MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { getUser } from "../utils/pocketbase";
import AuthContainer from "../components/form/authcontainer";
import AuthLayout from "../components/navigation/authlayout";
import PasswordChecklist from "../components/form/passwordchecklist";
import useSignup from "../hooks/useSignup";

const { VITE_PRIVACY_URL, VITE_TERMS_URL } = import.meta.env;

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

  if (getUser()) return <Redirect to="/" />;

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
        title={t("auth.signUp", "Sign Up")}
        subtitle={t(
          "auth.createAccount",
          "Create your account to get started with Ministry Mapper"
        )}
        validated={validated}
        onSubmit={handleFormSubmit}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.name", "User Name")}</Label>
          <Input
            id="name"
            type="text"
            placeholder={t("auth.enterName", "Enter Name")}
            value={formData.name}
            required
            aria-required="true"
            minLength={2}
            maxLength={50}
            pattern="[A-Za-z][\w\s.\-']*"
            autoFocus
            autoComplete="name"
            disabled={isCreating}
            onChange={handleInputChange}
            onBlur={() => setNameTouched(true)}
          />
          {(nameTouched || validated) && (
            <p className="text-xs text-muted-foreground">
              {t(
                "auth.nameHelp",
                "Must start with a letter. Letters, numbers, spaces, hyphens, and periods allowed."
              )}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">
            {t("auth.emailAddress", "Email Address")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("auth.enterEmail", "Enter email")}
            value={formData.email}
            required
            aria-required="true"
            autoComplete="email"
            disabled={isCreating}
            onChange={handleInputChange}
          />
          <p id="email-help" className="text-xs text-muted-foreground">
            {t(
              "auth.emailHelp",
              "We'll send a verification link to this email."
            )}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password", "Password")}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t("auth.password", "Password")}
            value={formData.password}
            required
            aria-required="true"
            autoComplete="new-password"
            disabled={isCreating}
            onChange={(e) => {
              setPasswordTouched(true);
              handleInputChange(e);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">
            {t("auth.confirmPassword", "Confirm Password")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t("auth.confirmPassword", "Confirm Password")}
            value={formData.confirmPassword}
            required
            aria-required="true"
            autoComplete="new-password"
            disabled={isCreating}
            onChange={handleInputChange}
          />
        </div>

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

        <p className="text-center text-xs text-muted-foreground">
          {t("auth.termsAgreement", "By signing up, you agree to our")}{" "}
          <a
            href={VITE_PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {t("auth.privacyPolicy", "privacy policy")}
          </a>{" "}
          {t("auth.andOur", "and our")}{" "}
          <a
            href={VITE_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {t("auth.termsOfService", "terms of service")}
          </a>
          .
        </p>

        <Button
          type="submit"
          className="w-full"
          disabled={!isPasswordValid || isCreating}
        >
          {isCreating && (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          )}
          {t("auth.signUp", "Sign Up")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
          <Button
            variant="link"
            className="h-auto p-0 font-semibold"
            disabled={isCreating}
            onClick={() => navigate("/", { replace: true })}
          >
            {t("auth.signIn", "Sign In")}
          </Button>
        </p>
      </AuthContainer>
    </AuthLayout>
  );
};

export default SignupComponent;
