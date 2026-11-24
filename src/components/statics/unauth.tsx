import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignInDifferentProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { getUser } from "../../utils/pocketbase";
import * as m from "motion/react-m";
import { fadeSlideUp } from "@/lib/motion";

// What a signed-in account sees while no congregation has added it: one
// message, the email to pass on, and one thing to do.
const UnauthorizedPage = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();
  const name = getUser("name") as string | null;
  const email = getUser("email") as string | null;

  return (
    <div className="flex h-[85dvh] items-center justify-center">
      <m.div variants={fadeSlideUp} initial="hidden" animate="show">
        {/* On a phone the card is the whole page, so its outline only boxes
            the content in; it frames the card from the sm breakpoint up. */}
        <Card className="max-sm:bg-transparent max-sm:shadow-none max-sm:ring-0">
          <CardContent className="flex flex-col items-center gap-5 text-center">
            <img
              alt={t("branding.logo", "Ministry Mapper logo")}
              className="w-20"
              src={getAssetUrl("android-chrome-192x192.png")}
            />
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold">
                {t("auth.unauthorizedAccessTitle", "You're signed in")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(
                  "auth.unauthorizedAccessMessage",
                  "Your account isn't part of a congregation yet."
                )}
              </p>
            </div>
            {/* The administrator finds the account by this, and someone who
                signed in with Google or Apple may not know which address it
                was. */}
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
            {/* Being added does not reach this page by itself: a reload reads
                the account's roles again. */}
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
      </m.div>
    </div>
  );
};

export default UnauthorizedPage;
