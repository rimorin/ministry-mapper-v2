import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { userInterface } from "../../utils/interface";
import UseAnotherButton from "./useanother";
import { useState } from "react";
import useNotification from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

import { cleanupSession, verifyEmail } from "../../utils/pocketbase";

const VerificationPage = ({ user }: userInterface) => {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const userEmail = user?.email;
  const [isSending, setIsSending] = useState(false);

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

  const handleClick = () => cleanupSession();

  return (
    <div className="flex h-[85dvh] items-center justify-center">
      <Card className="card-main gap-0 py-0">
        <CardContent className="pt-6 text-center">
          <img
            alt={t("branding.logo", "Ministry Mapper logo")}
            className="mx-auto block w-[30%]"
            src={getAssetUrl("android-chrome-192x192.png")}
          />
        </CardContent>
        <CardContent className="text-center">
          <CardTitle>
            {t(
              "auth.verifyEmailMessage",
              "Please verify your email address to continue."
            )}
          </CardTitle>
          <p className="mb-4 mt-2 text-center text-sm text-muted-foreground">
            {t("auth.didNotReceiveEmail", "Didn't receive verification email?")}
          </p>
          <div className="text-center">
            {isSending ? (
              <Spinner aria-hidden="true" />
            ) : (
              <span
                className="mb-6 inline-block cursor-pointer rounded-lg px-3 py-1.5 text-primary transition-[background-color,color] duration-200 ease-in hover:bg-primary/10 hover:text-primary/80 hover:underline"
                onClick={handleResendMail}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleResendMail();
                  }
                }}
              >
                {t("auth.resendVerificationEmail", "Resend verification email")}
              </span>
            )}
          </div>
        </CardContent>
        <UseAnotherButton handleClick={handleClick} />
      </Card>
    </div>
  );
};

export default VerificationPage;
