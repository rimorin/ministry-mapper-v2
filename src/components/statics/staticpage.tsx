import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { useTranslation } from "react-i18next";
import * as m from "motion/react-m";
import { fadeSlideUp } from "@/lib/motion";

interface StaticPageCardProps {
  title?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
  logoSrc?: string;
  logoAlt?: string;
  cardClassName?: string;
}

const StaticPageCard = ({
  title,
  children,
  showLogo = true,
  logoSrc = "android-chrome-192x192.png",
  logoAlt,
  cardClassName = "card-main"
}: StaticPageCardProps) => {
  const { t } = useTranslation();
  const defaultLogoAlt = t("branding.logo", "Ministry Mapper logo");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <m.div variants={fadeSlideUp} initial="hidden" animate="show">
        <Card className={cardClassName}>
          {showLogo && (
            <CardContent className="text-center">
              <img
                alt={logoAlt || defaultLogoAlt}
                className="mx-auto block w-[30%]"
                src={getAssetUrl(logoSrc)}
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
