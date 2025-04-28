import { useTranslation } from "react-i18next";

const ModeToggle = ({
  onClick,
  isMapView
}: {
  onClick: () => void;
  isMapView: boolean;
}) => {
  const { t } = useTranslation();

  const imgSrc = isMapView
    ? "https://assets.ministry-mapper.com/list.svg"
    : "https://assets.ministry-mapper.com/maplocation.svg";
  const imgAlt = isMapView
    ? t("navigation.listView", "List View")
    : t("navigation.mapView", "Map View");

  return (
    <button onClick={onClick} className="mode-toggle-button">
      <img src={imgSrc} alt={imgAlt} width={24} height={24} />
    </button>
  );
};

export default ModeToggle;
