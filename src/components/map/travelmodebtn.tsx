import React from "react";
import { ButtonGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import GenericButton from "../navigation/button";

interface TravelModeButtonsProps {
  travelMode: google.maps.TravelMode;
  onTravelModeChange: (mode: google.maps.TravelMode) => void;
}

const TravelModeButtons: React.FC<TravelModeButtonsProps> = ({
  travelMode,
  onTravelModeChange
}) => {
  const { t } = useTranslation();

  return (
    <ButtonGroup className="m-2" aria-label={t("navigation.transportModes")}>
      <GenericButton
        size="sm"
        variant={
          travelMode === google.maps.TravelMode.WALKING
            ? "primary"
            : "secondary"
        }
        aria-label={t("navigation.walkMode")}
        onClick={() => onTravelModeChange(google.maps.TravelMode.WALKING)}
        label="🚶"
      />
      <GenericButton
        size="sm"
        variant={
          travelMode === google.maps.TravelMode.DRIVING
            ? "primary"
            : "secondary"
        }
        aria-label={t("navigation.driveMode")}
        onClick={() => onTravelModeChange(google.maps.TravelMode.DRIVING)}
        label="🚗"
      />
      <GenericButton
        size="sm"
        variant={
          travelMode === google.maps.TravelMode.TRANSIT
            ? "primary"
            : "secondary"
        }
        aria-label={t("navigation.transitMode")}
        onClick={() => onTravelModeChange(google.maps.TravelMode.TRANSIT)}
        label="🚌"
      />
    </ButtonGroup>
  );
};

export default TravelModeButtons;
