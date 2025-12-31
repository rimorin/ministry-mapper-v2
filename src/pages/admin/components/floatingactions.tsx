import { Spinner, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import SpeedDial from "../../../components/navigation/speeddial";
import BackToTopButton from "../../../components/navigation/backtotop";
import ModeToggle from "../../../components/navigation/maptoggle";
import { getAssetUrl } from "../../../utils/helpers/assetpath";

interface FloatingActionsProps {
  showBkTopButton: boolean;
  isMapView: boolean;
  isAssignmentLoading: boolean;
  onToggleMapView: () => void;
  onGenerateLink: () => void;
}

export default function FloatingActions({
  showBkTopButton,
  isMapView,
  isAssignmentLoading,
  onToggleMapView,
  onGenerateLink
}: FloatingActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <SpeedDial
        actions={[
          {
            icon: <ModeToggle isMapView={isMapView} />,
            label: isMapView
              ? t("navigation.listView")
              : t("navigation.mapView"),
            onClick: onToggleMapView
          },
          {
            icon: isAssignmentLoading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                aria-hidden="true"
              />
            ) : (
              <Image
                src={getAssetUrl("stars.svg")}
                alt="stars"
                width={24}
                height={24}
              />
            ),
            label: t("navigation.generateLink"),
            onClick: onGenerateLink,
            keepOpen: true
          }
        ]}
        direction="up"
      />
      <BackToTopButton showButton={showBkTopButton} />
    </>
  );
}
