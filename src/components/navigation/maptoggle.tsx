import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { Image } from "react-bootstrap";

const ModeToggle = ({ isMapView }: { isMapView: boolean }) => {
  const { t } = useTranslation();

  const imgSrc = isMapView
    ? getAssetUrl("list.svg")
    : getAssetUrl("maplocation.svg");
  const imgAlt = isMapView
    ? t("navigation.listView", "List View")
    : t("navigation.mapView", "Map View");

  return <Image src={imgSrc} alt={imgAlt} width={24} height={24} />;
};

export default ModeToggle;
