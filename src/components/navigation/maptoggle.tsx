import { useTranslation } from "react-i18next";
import { List, Navigation } from "lucide-react";

const ModeToggle = ({ isMapView }: { isMapView: boolean }) => {
  const { t } = useTranslation();
  return isMapView ? (
    <List
      width={24}
      height={24}
      aria-label={t("navigation.listView", "List View")}
    />
  ) : (
    <Navigation
      width={24}
      height={24}
      aria-label={t("navigation.mapView", "Map View")}
    />
  );
};

export default ModeToggle;
