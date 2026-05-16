import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useEffect, useState, type ReactElement } from "react";
import Loader from "../components/statics/loader";
import AuthLayout from "../components/navigation/authlayout";
import { MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { useSearch, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import PasswordChecklist from "../components/form/passwordchecklist";
import usePasswordReset from "../hooks/usePasswordReset";

const MODE_RESET_PASSWORD = "resetPassword";
const MODE_VERIFY_EMAIL = "verifyEmail";

const UserManagementComponent = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [validated, setValidated] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoginPasswordOk, setIsLoginPasswordOk] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";

  const {
    isProcessing,
    isResetting,
    message,
    isSuccess,
    handleResetPassword: resetPassword,
    handleVerifyEmail: verifyEmail
  } = usePasswordReset();

  const resetCreationForm = () => {
    setLoginPassword("");
    setConfirmPassword("");
    setValidated(false);
  };

  useEffect(() => {
    if (mode === MODE_VERIFY_EMAIL) {
      verifyEmail(oobCode);
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentionally run on mount only
  }, []);

  let managementComponent: ReactElement;
  switch (mode) {
    case MODE_RESET_PASSWORD:
      managementComponent = (
        <Card className="w-full shadow-md">
          <CardHeader className="items-center text-center pb-2">
            <div
              className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-2xl"
              role="img"
              aria-label={t("auth.securityIcon", "Security")}
            >
              <KeyRound className="size-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">
              {t("auth.resetPassword", "Reset Password")}
            </CardTitle>
            <CardDescription>
              {t("auth.enterNewPassword", "Enter your new password below")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              data-validated={validated}
              onSubmit={(event) => {
                event.preventDefault();
                resetPassword(oobCode, loginPassword, confirmPassword);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="reset-password">
                  {t("auth.password", "Password")}
                </Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password", "Password")}
                    value={loginPassword}
                    required
                    aria-required="true"
                    autoFocus
                    autoComplete="new-password"
                    disabled={isResetting}
                    onChange={(event) => {
                      setPasswordTouched(true);
                      setLoginPassword(event.target.value);
                    }}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? t("auth.hidePassword", "Hide password")
                        : t("auth.showPassword", "Show password")
                    }
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm-password">
                  {t("auth.confirmPassword", "Confirm Password")}
                </Label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirmPassword", "Confirm Password")}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    aria-required="true"
                    autoComplete="new-password"
                    disabled={isResetting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? t("auth.hidePassword", "Hide password")
                        : t("auth.showPassword", "Show password")
                    }
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {(passwordTouched || validated) && (
                <div id="password-requirements">
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
                      number: t(
                        "password.number",
                        "Password must contain numbers."
                      ),
                      capital: t(
                        "password.capital",
                        "Password must contain uppercase letters."
                      ),
                      match: t("password.match", "Passwords must match.")
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!isLoginPasswordOk || isResetting}
                >
                  {isResetting && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t("common.submit", "Submit")}
                </Button>
                <Button
                  type="reset"
                  variant="outline"
                  className="flex-1"
                  disabled={isResetting}
                  onClick={resetCreationForm}
                >
                  {t("common.clear", "Clear")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
      break;
    default:
      managementComponent = (
        <Card className="w-full shadow-md">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
            <XCircle className="size-16 text-destructive" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {t("errors.invalidRequest", "Invalid Request")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "errors.invalidRequestMessage",
                  "This link is invalid or has expired."
                )}
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/")}>
              {t("navigation.goHome", "Go to Home")}
            </Button>
          </CardContent>
        </Card>
      );
  }

  if (message) {
    managementComponent = (
      <Card className="w-full shadow-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
          {isSuccess ? (
            <CheckCircle2
              className="size-16 text-green-500"
              aria-hidden="true"
            />
          ) : (
            <XCircle className="size-16 text-destructive" aria-hidden="true" />
          )}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {isSuccess
                ? t("common.success", "Success!")
                : t("common.error", "Error")}
            </h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button className="w-full" onClick={() => navigate("/")}>
            {t("auth.backToLogin", "Back to Login")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isProcessing) return <Loader />;

  return <AuthLayout>{managementComponent}</AuthLayout>;
};

export default UserManagementComponent;
