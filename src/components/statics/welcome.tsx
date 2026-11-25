import { WelcomeProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import AppLogo from "../common/app-logo";
import * as m from "motion/react-m";
import { fadeSlideUp } from "@/lib/motion";

const Welcome = ({ name }: WelcomeProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center p-4 pb-[20%]">
      <m.div
        className="flex w-full max-w-xs flex-col items-center gap-2 text-center"
        variants={fadeSlideUp}
        initial="hidden"
        animate="show"
      >
        <AppLogo
          className="mb-2 size-16"
          label={t("branding.logo", "Ministry Mapper logo")}
        />
        <p className="text-xl font-semibold">
          {t("auth.welcome")} {name || t("auth.welcomeDefault")}! 👋
        </p>
        <p className="text-sm text-muted-foreground">
          {t("territory.selectTerritory")}
        </p>
      </m.div>
    </div>
  );
};

export default Welcome;
