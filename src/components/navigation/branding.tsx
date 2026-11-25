import { BrandingProps } from "../../utils/interface";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import AppLogo from "../common/app-logo";

const NavBarBranding = ({
  naming,
  hideNameOnMobile = false
}: BrandingProps) => {
  const { t } = useTranslation();

  return (
    <a className="brand-wrap flex min-w-0 items-center gap-2 text-inherit no-underline hover:no-underline">
      <AppLogo
        className="size-8"
        label={t("branding.logo", "Ministry Mapper logo")}
      />
      {naming && (
        <span
          className={cn(
            "font-bold text-sm truncate",
            hideNameOnMobile && "hidden sm:inline"
          )}
        >
          {naming}
        </span>
      )}
    </a>
  );
};

export default NavBarBranding;
