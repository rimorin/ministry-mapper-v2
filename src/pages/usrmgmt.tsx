import { useEffect, useState, type ReactNode } from "react";
import { useSearch, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "@/components/ui/input-group";
import Loader from "../components/statics/loader";
import AuthLayout from "../components/navigation/authlayout";
import AuthContainer from "../components/form/authcontainer";
import { authCardClass } from "../components/form/authcard";
import { MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import PasswordChecklist from "../components/form/passwordchecklist";
import usePasswordReset from "../hooks/usePasswordReset";

const MODE_RESET_PASSWORD = "resetPassword";
const MODE_VERIFY_EMAIL = "verifyEmail";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  children?: ReactNode;
}

const PasswordField = ({
  id,
  label,
  value,
  disabled,
  onChange,
  children
}: PasswordFieldProps) => {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={shown ? "text" : "password"}
          placeholder={label}
          value={value}
          required
          aria-required="true"
          autoComplete="new-password"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={() => setShown((showing) => !showing)}
            aria-label={
              shown
                ? t("auth.hidePassword", "Hide password")
                : t("auth.showPassword", "Show password")
            }
          >
            {shown ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {children}
    </Field>
  );
};

interface ResultProps {
  ok: boolean;
  heading: string;
  detail?: string;
  action: string;
  onAction: () => void;
}

const Result = ({ ok, heading, detail, action, onAction }: ResultProps) => (
  <Card className={authCardClass}>
    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
      {ok ? (
        <CheckCircle2 className="size-16 text-success" aria-hidden="true" />
      ) : (
        <XCircle className="size-16 text-destructive" aria-hidden="true" />
      )}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </div>
      <Button className="w-full" onClick={onAction}>
        {action}
      </Button>
    </CardContent>
  </Card>
);

const UserManagementComponent = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoginPasswordOk, setIsLoginPasswordOk] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";

  const {
    isResetting,
    message,
    isSuccess,
    handleResetPassword: resetPassword,
    handleVerifyEmail: verifyEmail
  } = usePasswordReset();

  useEffect(() => {
    if (mode === MODE_VERIFY_EMAIL) {
      verifyEmail(oobCode);
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentionally run on mount only
  }, []);

  const goHome = () => navigate("/");
  const backToSignIn = t("auth.backToLogin", "Back to sign in");

  // The first render precedes the verify request; without this the
  // failure screen flashes.
  if (mode === MODE_VERIFY_EMAIL && !message) {
    return <Loader />;
  }

  let content: ReactNode;
  if (message) {
    const failedHeading =
      mode === MODE_VERIFY_EMAIL
        ? t("auth.linkFailed", "This link didn't work")
        : t("auth.resetFailed", "Your password was not changed");
    content = (
      <Result
        ok={isSuccess}
        heading={isSuccess ? message : failedHeading}
        detail={isSuccess ? undefined : message}
        action={
          isSuccess && mode === MODE_VERIFY_EMAIL
            ? t("auth.continue", "Continue")
            : backToSignIn
        }
        onAction={goHome}
      />
    );
  } else if (mode === MODE_RESET_PASSWORD) {
    content = (
      <AuthContainer
        title={t("auth.resetPassword", "Set a new password")}
        subtitle={t("auth.enterNewPassword", "Enter your new password below")}
        icon={<KeyRound className="size-6" aria-hidden="true" />}
        onSubmit={(event) => {
          event.preventDefault();
          resetPassword(oobCode, loginPassword, confirmPassword);
        }}
      >
        <FieldGroup className="gap-5">
          <PasswordField
            id="reset-password"
            label={t("auth.password", "Password")}
            value={loginPassword}
            disabled={isResetting}
            onChange={(value) => {
              setPasswordTouched(true);
              setLoginPassword(value);
            }}
          >
            {!passwordTouched && (
              <FieldDescription>
                {t(
                  "auth.passwordHelp",
                  "At least {{length}} characters, with a number and a capital letter.",
                  { length: MINIMUM_PASSWORD_LENGTH }
                )}
              </FieldDescription>
            )}
          </PasswordField>

          <PasswordField
            id="reset-confirm-password"
            label={t("auth.confirmPassword", "Confirm password")}
            value={confirmPassword}
            disabled={isResetting}
            onChange={setConfirmPassword}
          />

          {passwordTouched && (
            <PasswordChecklist
              password={loginPassword}
              passwordConfirm={confirmPassword}
              minLength={MINIMUM_PASSWORD_LENGTH}
              onChange={setIsLoginPasswordOk}
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
            <Button type="submit" disabled={!isLoginPasswordOk || isResetting}>
              {isResetting && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("auth.saveNewPassword", "Save new password")}
            </Button>
          </Field>
        </FieldGroup>
      </AuthContainer>
    );
  } else {
    content = (
      <Result
        ok={false}
        heading={t("auth.linkFailed", "This link didn't work")}
        detail={t(
          "errors.invalidRequestMessage",
          "This link is invalid or has expired."
        )}
        action={backToSignIn}
        onAction={goHome}
      />
    );
  }

  return <AuthLayout>{content}</AuthLayout>;
};

export default UserManagementComponent;
