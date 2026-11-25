import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import * as m from "motion/react-m";
import { fadeSlideUp } from "@/lib/motion";
import AppLogo from "../common/app-logo";

interface StaticPageCardProps {
  title?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
  cardClassName?: string;
}

const StaticPageCard = ({
  title,
  children,
  showLogo = true,
  cardClassName = "card-main"
}: StaticPageCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <m.div variants={fadeSlideUp} initial="hidden" animate="show">
        <Card className={cardClassName}>
          {showLogo && (
            <CardContent className="text-center">
              <AppLogo
                className="mx-auto w-[30%]"
                label={t("branding.logo", "Ministry Mapper logo")}
              />
            </CardContent>
          )}
          <CardContent>
            {title && (
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-center">{title}</CardTitle>
              </CardHeader>
            )}
            {children}
          </CardContent>
        </Card>
      </m.div>
    </div>
  );
};

export default StaticPageCard;
