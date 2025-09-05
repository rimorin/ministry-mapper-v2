import React, { useState, useRef } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { SpeedDialAction, SpeedDialProps } from "../../utils/interface";
import { SPEED_DIAL } from "../../utils/constants";
import "./../../css/speeddial.css";

const SpeedDial: React.FC<SpeedDialProps> = ({
  icon = (
    <img
      src={SPEED_DIAL.DEFAULTS.ICON_URL}
      alt="plus"
      width={SPEED_DIAL.DEFAULTS.ICON_SIZE}
      height={SPEED_DIAL.DEFAULTS.ICON_SIZE}
    />
  ),
  actions,
  direction = SPEED_DIAL.DEFAULTS.DIRECTION,
  className = "",
  size,
  variant = SPEED_DIAL.DEFAULTS.VARIANT,
  keepOpenOnAction = false,
  position = SPEED_DIAL.DEFAULTS.POSITION
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const speedDialRef = useRef<HTMLDivElement>(null);

  const toggleSpeedDial = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: SpeedDialAction) => {
    action.onClick();

    // Check if this specific action or global setting prevents closing
    const shouldKeepOpen = action.keepOpen || keepOpenOnAction;

    if (!shouldKeepOpen) {
      setIsOpen(false);
    }
  };

  const getActionPosition = (index: number) => {
    const baseOffset = SPEED_DIAL.SPACING.ACTION_DISTANCE * (index + 1);
    const centerOffset = SPEED_DIAL.SPACING.CENTER_OFFSET;

    switch (direction) {
      case "up":
        return {
          bottom: `${baseOffset}px`,
          left: `${centerOffset}px`
        };
      case "down":
        return {
          top: `${baseOffset}px`,
          left: `${centerOffset}px`
        };
      case "left":
        return {
          top: `${centerOffset}px`,
          right: `${baseOffset}px`
        };
      case "right":
        return {
          top: `${centerOffset}px`,
          left: `${baseOffset}px`
        };
      default:
        return {
          bottom: `${baseOffset}px`,
          left: `${centerOffset}px`
        };
    }
  };

  const getTooltipPlacement = () => {
    switch (direction) {
      case "up":
      case "down":
        return "right";
      case "left":
      case "right":
        return "top";
      default:
        return "right";
    }
  };

  return (
    <div
      ref={speedDialRef}
      className={`speed-dial ${className}`}
      style={{
        position: "fixed",
        zIndex: SPEED_DIAL.STYLES.Z_INDEX,
        ...position
      }}
    >
      {/* Action buttons */}
      {actions.map((action, index) => (
        <OverlayTrigger
          key={index}
          placement={getTooltipPlacement()}
          overlay={<Tooltip id={`tooltip-${index}`}>{action.label}</Tooltip>}
        >
          <Button
            variant={action.variant || "light"}
            size={size}
            className={`speed-dial-action ${isOpen ? "speed-dial-action-open" : ""}`}
            style={{
              position: "absolute",
              borderRadius: "50%",
              width: SPEED_DIAL.DIMENSIONS.ACTION_SIZE.WIDTH,
              height: SPEED_DIAL.DIMENSIONS.ACTION_SIZE.HEIGHT,
              boxShadow: SPEED_DIAL.STYLES.BOX_SHADOW.ACTION,
              transform: isOpen
                ? `scale(${SPEED_DIAL.TRANSFORM.SCALE.NORMAL})`
                : `scale(${SPEED_DIAL.TRANSFORM.SCALE.CLOSED})`,
              opacity: isOpen ? SPEED_DIAL.STYLES.OPACITY : 0,
              transition: `all ${SPEED_DIAL.TRANSITIONS.DURATION} ${SPEED_DIAL.TRANSITIONS.EASING} ${index * SPEED_DIAL.TRANSITIONS.STAGGER_DELAY}s`,
              ...getActionPosition(index)
            }}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
          >
            {action.icon}
          </Button>
        </OverlayTrigger>
      ))}

      <Button
        variant={actions.length > 0 ? actions[0].variant || "light" : variant}
        size={size}
        className="speed-dial-fab"
        style={{
          position: "relative",
          borderRadius: "50%",
          width: SPEED_DIAL.DIMENSIONS.FAB_SIZE.WIDTH,
          height: SPEED_DIAL.DIMENSIONS.FAB_SIZE.HEIGHT,
          boxShadow: SPEED_DIAL.STYLES.BOX_SHADOW.FAB,
          transition: `transform ${SPEED_DIAL.TRANSITIONS.DURATION} ${SPEED_DIAL.TRANSITIONS.EASING}`,
          transform: isOpen
            ? `rotate(${SPEED_DIAL.TRANSFORM.ROTATION.OPEN})`
            : `rotate(${SPEED_DIAL.TRANSFORM.ROTATION.CLOSED})`,
          opacity: SPEED_DIAL.STYLES.OPACITY
        }}
        onClick={toggleSpeedDial}
      >
        {icon}
      </Button>

      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="speed-dial-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0,0,0,${SPEED_DIAL.STYLES.BACKDROP_OPACITY})`,
            zIndex: -1
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SpeedDial;
