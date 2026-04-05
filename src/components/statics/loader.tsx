import { useLayoutEffect, useRef } from "react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

// Matches Bootstrap's --bs-spinner-animation-speed (0.75s)
const SPINNER_DURATION_MS = 750;

const Loader: React.FC = () => {
  const { t } = useTranslation();
  const spinnerRef = useRef<HTMLDivElement>(null);

  // Runs after commit, before first paint — no purity violation, no extra re-render.
  // Negative delay keeps the spinner phase-continuous across remounts: each new
  // Loader instance starts at the same rotation it would have if spinning since page load.
  useLayoutEffect(() => {
    if (spinnerRef.current) {
      spinnerRef.current.style.animationDelay = `${-(performance.now() % SPINNER_DURATION_MS)}ms`;
    }
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner
          ref={spinnerRef}
          animation="border"
          variant="primary"
          className="loading-spinner"
        />
        <div className="loading-text">{t("common.loading")}</div>
      </div>
    </div>
  );
};

export default Loader;
