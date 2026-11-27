import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { MapPinOff, TimerOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { authCardClass } from "../form/authcard";
import AuthLayout from "../navigation/authlayout";
import type { LinkEnd } from "../../hooks/useMapLink";
import { getUser } from "../../utils/pocketbase";

interface InvalidPageProps {
  reason: LinkEnd;
}

const InvalidPage = ({ reason }: InvalidPageProps) => {
  const { t } = useTranslation();

  const { title, body } = {
    expired: {
      title: t("mapEnded.expiredTitle", "Time's up for this map"),
      body: t(
        "mapEnded.expiredBody",
        "The time given for this map has run out."
      )
    },
    "taken-back": {
      title: t("mapEnded.takenBackTitle", "This map was taken back"),
      body: t("mapEnded.takenBackBody", "Your conductor ended this assignment.")
    },
    unknown: {
      title: t("mapEnded.unknownTitle", "This map is no longer available"),
      body: t(
        "mapEnded.unknownBody",
        "Its time ran out, or your conductor ended it."
      )
    }
  }[reason];
  const Icon = reason === "expired" ? TimerOff : MapPinOff;

  return (
    <AuthLayout>
      <Card className={authCardClass}>
        <CardContent className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
          {getUser("id") ? (
            <Link
              href="/"
              replace
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              {t("mapEnded.backToMyMaps", "Back to My Maps")}
            </Link>
          ) : (
            <p className="text-sm">
              {t(
                "mapEnded.askForLink",
                "Ask your conductor if you need a new link. You can close this tab."
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default InvalidPage;
