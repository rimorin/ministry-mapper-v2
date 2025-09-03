import { memo } from "react";
import { Navbar, Image } from "react-bootstrap";
import { BrandingProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const NavBarBranding = memo(({ naming }: BrandingProps) => {
  const { t } = useTranslation();

  return (
    <Navbar.Brand className="brand-wrap d-flex">
      <div style={{ flex: "0 0 10%", marginRight: "2px" }}>
        <Image
          alt={t("branding.logo", "Ministry Mapper logo")}
          src={getAssetUrl("favicon-32x32.png")}
          width="32"
          height="32"
          className="d-inline-block align-top"
        />
      </div>
      <div style={{ flex: "1" }}>
        <Navbar.Text className="fluid-bolding fluid-text">{naming}</Navbar.Text>
      </div>
    </Navbar.Brand>
  );
});

export default NavBarBranding;
