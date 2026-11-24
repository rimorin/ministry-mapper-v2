import { useTranslation } from "react-i18next";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authCardClass } from "../form/authcard";
import AuthLayout from "../navigation/authlayout";
import { SignInDifferentProps } from "../../utils/interface";
import { getUser } from "../../utils/pocketbase";

const UnauthorizedPage = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();
  const name = getUser("name") as string | null;
  const email = getUser("email") as string | null;

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
              "auth.existingUserMessage",
              "Ask your congregation administrator to add you using this email, then check again."
            )}
          </p>
          {/* A reload re-reads the account's roles. */}
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => window.location.reload()}
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
