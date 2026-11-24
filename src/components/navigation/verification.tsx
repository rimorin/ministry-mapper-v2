import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authCardClass } from "../form/authcard";
import AuthLayout from "./authlayout";
import { userInterface } from "../../utils/interface";
import useNotification from "../../hooks/useNotification";
import useOnTabFocus from "../../hooks/useOnTabFocus";
import {
  cleanupSession,
  refreshAuth,
  verifyEmail
} from "../../utils/pocketbase";

const VerificationPage = ({ user }: userInterface) => {
  const { t } = useTranslation();
  const { notifyError, notifySuccess, notifyWarning } = useNotification();
  const userEmail = user?.email;
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // The front page leaves this screen once the refreshed account reads as
  // verified.
  useOnTabFocus(() => void refreshAuth().catch(() => {}));

  const handleContinue = async () => {
    setIsChecking(true);
    try {
      const { record } = await refreshAuth();
      if (!record.verified) {
        notifyWarning(
          t(
            "auth.notVerifiedYet",
            "Not verified yet. Open the link in the email first."
          )
        );
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendMail = async () => {
    setIsSending(true);
    try {
      await verifyEmail(userEmail);
      notifySuccess(
        t(
          "auth.verificationEmailResent",
          "Resent verification email! Please check your inbox or spam folder."
        )
      );
    } catch (error) {
      notifyError(error);
    } finally {
      setIsSending(false);
    }
  };

  const isBusy = isSending || isChecking;

  return (
    <AuthLayout>
      <Card className={authCardClass}>
        <CardContent className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Mail className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.verifyEmailMessage", "Verify your email")}
          </h1>
          <div className="w-full rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-sm break-all select-all">{userEmail}</p>
          </div>
          <p className="text-sm">
            {t(
              "auth.verifyEmailSent",
              "We sent a link to this address. Open it to continue, and check your spam folder if you don't see it."
            )}
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={isBusy}
              onClick={handleContinue}
            >
              {isChecking && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("auth.verifiedContinue", "I've verified, continue")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isBusy}
              onClick={handleResendMail}
            >
              {isSending && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("auth.resendVerificationEmail", "Send the link again")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={isBusy}
              onClick={() => cleanupSession()}
            >
              {t("auth.useAnotherAccount", "Use another account")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default VerificationPage;
