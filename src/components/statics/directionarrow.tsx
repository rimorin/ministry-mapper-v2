import { memo, useEffect, useState, useRef } from "react";

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DirectionArrowProps {
  onPermissionDenied?: () => void;
}

const DirectionArrow = ({ onPermissionDenied }: DirectionArrowProps) => {
  const [heading, setHeading] = useState<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const THROTTLE_MS = 100;

  useEffect(() => {
    if (!window.isSecureContext) {
      console.warn("DeviceOrientation requires HTTPS");
      onPermissionDenied?.();
      return;
    }

    const handleOrientation = (event: DeviceOrientationEventiOS) => {
      const now = Date.now();
      if (now - lastUpdateTime.current < THROTTLE_MS) {
        return;
      }
      lastUpdateTime.current = now;

      let compassHeading: number;

      if (event.webkitCompassHeading !== undefined) {
        compassHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        compassHeading = 360 - event.alpha;
      } else {
        return;
      }

      setHeading(compassHeading);
    };

    const setupListeners = () => {
      const hasAbsoluteEvent = "ondeviceorientationabsolute" in window;
      if (hasAbsoluteEvent) {
        (window as Window & typeof globalThis).addEventListener(
          "deviceorientationabsolute",
          handleOrientation as EventListener,
          true
        );
      } else {
        window.addEventListener(
          "deviceorientation",
          handleOrientation as EventListener,
          true
        );
      }
    };

    const requestPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const permission =
            await // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (DeviceOrientationEvent as any).requestPermission();
          if (permission === "granted") {
            setupListeners();
          } else {
            onPermissionDenied?.();
          }
        } catch (error) {
          console.error("Permission request failed:", error);
          onPermissionDenied?.();
        }
      } else {
        setupListeners();
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener(
        "deviceorientation",
        handleOrientation as EventListener
      );
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as EventListener
      );
    };
  }, [onPermissionDenied]);

  return (
    <div className="direction-arrow-container">
      <div className="direction-arrow-marker">
        <div className="direction-arrow-ripple" />
        <svg
          className="direction-arrow-svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{
            transform: `rotate(${heading}deg)`
          }}
        >
          <path
            d="M8 0 L12 14 L8 11 L4 14 Z"
            className="direction-arrow-path"
          />
        </svg>
      </div>
    </div>
  );
};

export default memo(DirectionArrow);
