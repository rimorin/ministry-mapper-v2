import { useTranslation } from "react-i18next";
import { Copy, Send, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authCardClass } from "../form/authcard";
import AuthLayout from "../navigation/authlayout";
import useNotification from "../../hooks/useNotification";
import useOnTabFocus from "../../hooks/useOnTabFocus";
import useRealtimeSubscription from "../../hooks/useRealtime";
import { SignInDifferentProps } from "../../utils/interface";
import { getList, getUser, isAbortError } from "../../utils/pocketbase";

const UnauthorizedPage = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();
  const { notifySuccess } = useNotification();
  const userId = (getUser("id") as string | null) ?? "";
  const name = getUser("name") as string | null;
  const email = getUser("email") as string | null;
  const canShare = typeof navigator.share === "function";

  // A reload starts the app over with the account's new role.
  const checkAgain = () => window.location.reload();

  // Moves on by itself once the account is added, whether this screen is
  // open at the time or the person comes back to it afterwards.
  useRealtimeSubscription(
    "roles",
    checkAgain,
    { filter: `user="${userId}"`, fields: "id" },
    [userId],
    !!userId
  );
  useOnTabFocus(() => {
    getList("roles", {
      filter: `user="${userId}"`,
      fields: "id",
      requestKey: `waiting-roles-${userId}`
    })
      .then((roles) => {
        if (roles.length > 0) checkAgain();
      })
      .catch(() => {});
  });

  const sendEmail = async () => {
    if (!email) return;
    if (canShare) {
      try {
        await navigator.share({
          text: t(
            "auth.addMeMessage",
            "Please add me to Ministry Mapper. My email is {{email}}",
            { email }
          )
        });
        return;
      } catch (error) {
        if (isAbortError(error)) return;
      }
    }
    try {
      await navigator.clipboard.writeText(email);
      notifySuccess(t("auth.emailCopied", "Email copied"));
    } catch {
      // Clipboard refused: the email is still on screen to copy by hand.
    }
  };

  return (
    <AuthLayout>
      <Card className={authCardClass}>
        <CardContent className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UserCheck className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.unauthorizedAccessTitle", "You're signed in")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "auth.unauthorizedAccessMessage",
                "Your account isn't part of a congregation yet."
              )}
            </p>
          </div>
          {email && (
            <div className="w-full rounded-lg border bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("auth.signedInAs", "Signed in as")}
              </p>
              {name && <p className="truncate font-medium">{name}</p>}
              <p className="text-sm break-all select-all">{email}</p>
            </div>
          )}
          <p className="text-sm">
            {t(
              "auth.waitingMessage",
              "Ask your congregation administrator to add you with this email. This page moves on by itself once they do."
            )}
          </p>
          <div className="flex w-full flex-col gap-2">
            {email && (
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={sendEmail}
              >
                {canShare ? (
                  <Send aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                {canShare
                  ? t("auth.sendEmail", "Send my email to my administrator")
                  : t("auth.copyEmail", "Copy my email")}
              </Button>
            )}
            <Button
              type="button"
              variant={email ? "outline" : "default"}
              size="lg"
              className="w-full"
              onClick={checkAgain}
            >
              {t("auth.checkAgain", "Check again")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleClick}
            >
              {t("auth.useAnotherAccount", "Use another account")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("auth.newUserTitle", "Setting up a new congregation?")}{" "}
            <a href="mailto:rimorin@gmail.com" className="underline">
              {t("auth.emailLinkText", "Contact us")}
            </a>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default UnauthorizedPage;
