import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SignInDifferentProps } from "../../utils/interface";
import UseAnotherButton from "../navigation/useanother";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import * as m from "motion/react-m";
import { fadeSlideUp } from "@/lib/motion";

const UnauthorizedPage = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-[85dvh] items-center justify-center">
      <m.div variants={fadeSlideUp} initial="hidden" animate="show">
        <Card className="card-main">
          <CardContent className="text-center">
            <img
              alt={t("branding.logo", "Ministry Mapper logo")}
              className="mx-auto block w-[30%]"
              src={getAssetUrl("android-chrome-192x192.png")}
            />
          </CardContent>
          <CardContent>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-center">
                {t("auth.unauthorizedAccessTitle", "Access Denied 🔐")}
              </CardTitle>
            </CardHeader>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {t(
                "auth.unauthorizedAccessMessage",
                "You don't have permission to access this system."
              )}
            </p>
            <Alert variant="warning">
              <AlertTitle className="text-center">
                {t("auth.contactInstructions", "What can you do?")}
              </AlertTitle>
              <Separator className="my-2 bg-amber-200 dark:bg-amber-800" />
              <AlertDescription>
                <p className="mb-3">
                  <strong>
                    {t(
                      "auth.existingUserTitle",
                      "Already part of a congregation?"
                    )}
                  </strong>
                  <br />
                  {t(
                    "auth.existingUserMessage",
                    "Ask your administrator to grant you access."
                  )}
                </p>
                <Separator className="my-2 bg-amber-200 dark:bg-amber-800" />
                <p>
                  <strong>
                    {t("auth.newUserTitle", "Need a new account?")}
                  </strong>
                  <br />
                  {t("auth.newUserMessage", "Please")}{" "}
                  <a href="mailto:rimorin@gmail.com">
                    {t("auth.emailLinkText", "contact us")}
                  </a>{" "}
                  {t("auth.newUserMessageEnd", "to set up access.")}
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
          <div className="flex justify-center px-6">
            <UseAnotherButton handleClick={handleClick} />
          </div>
        </Card>
      </m.div>
    </div>
  );
};

export default UnauthorizedPage;
