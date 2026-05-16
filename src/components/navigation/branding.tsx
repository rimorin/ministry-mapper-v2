import { BrandingProps } from "../../utils/interface";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const NavBarBranding = ({
  naming,
  hideNameOnMobile = false
}: BrandingProps) => {
  const { t } = useTranslation();

  return (
    <a className="brand-wrap flex min-w-0 items-center gap-2 text-inherit no-underline hover:no-underline">
      <img
        alt={t("branding.logo", "Ministry Mapper logo")}
        src={getAssetUrl("favicon-32x32.png")}
        width="32"
        height="32"
        className="shrink-0 inline-block align-top dark:brightness-150"
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
