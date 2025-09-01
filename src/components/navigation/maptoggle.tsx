import { useTranslation } from "react-i18next";

const ModeToggle = ({ isMapView }: { isMapView: boolean }) => {
  const { t } = useTranslation();

  const imgSrc = isMapView
    ? "https://assets.ministry-mapper.com/list.svg"
    : "https://assets.ministry-mapper.com/maplocation.svg";
  const imgAlt = isMapView
    ? t("navigation.listView", "List View")
    : t("navigation.mapView", "Map View");

  return <img src={imgSrc} alt={imgAlt} width={24} height={24} />;
};

export default ModeToggle;
