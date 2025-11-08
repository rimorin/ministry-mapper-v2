import React from "react";
import { ButtonGroup, Button, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { TravelMode, TravelModeButtonsProps } from "../../utils/interface";

const TravelModeButtons: React.FC<TravelModeButtonsProps> = ({
  travelMode,
  onTravelModeChange,
  isLoading = false
}) => {
  const { t } = useTranslation();

  const modes: Array<{
    value: TravelMode;
    icon: string;
    label: string;
    position: string;
  }> = [
    {
      value: "WALKING",
      icon: "🚶",
      label: t("navigation.walkMode", "Walk"),
      position: "first"
    },
    {
      value: "DRIVING",
      icon: "🚗",
      label: t("navigation.driveMode", "Drive"),
      position: "last"
    }
  ];

  return (
    <ButtonGroup className="shadow-sm travel-mode-button-group">
      {modes.map((mode) => {
        const isActive = travelMode === mode.value;
        return (
          <Button
            key={mode.value}
            size="sm"
            variant={isActive ? "primary" : "light"}
            aria-label={mode.label}
            aria-pressed={isActive}
            onClick={() => onTravelModeChange(mode.value)}
            disabled={isLoading}
            className={`travel-mode-btn ${mode.position}${isActive ? " active" : ""}${isLoading ? " loading" : ""}`}
          >
            {isLoading && isActive && (
              <div
                className={`travel-mode-btn-spinner-overlay ${mode.position}`}
              >
                <Spinner animation="border" size="sm" variant="primary" />
              </div>
            )}
            <span className="travel-mode-btn-icon">{mode.icon}</span>
            <span className="travel-mode-btn-label">{mode.label}</span>
          </Button>
        );
      })}
    </ButtonGroup>
  );
};

export default TravelModeButtons;
