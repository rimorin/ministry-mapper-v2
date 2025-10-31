import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { use } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../utils/context";
import { ThemeMode } from "../../utils/interface";

const ThemeSettingsModal = NiceModal.create(() => {
  const modal = useModal();
  const { t } = useTranslation();
  const { theme, setTheme } = use(ThemeContext);

  const handleThemeChange = (selectedTheme: ThemeMode) => {
    setTheme(selectedTheme);
  };

  const handleClose = () => {
    modal.hide();
  };

  return (
    <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
      <Modal.Header closeButton>
        <Modal.Title>{t("theme.settings", "Theme Settings")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">
          {t(
            "theme.description",
            "Choose your preferred theme or follow your system settings"
          )}
        </p>

        <Form.Check
          type="radio"
          id="theme-light"
          name="theme-selection"
          label={
            <div className="d-flex align-items-center">
              <span className="me-2" role="img" aria-hidden="true">
                ☀️
              </span>
              <div>
                <div className="fw-semibold">{t("theme.light", "Light")}</div>
                <small className="text-muted">
                  {t("theme.lightDescription", "Bright and clear theme")}
                </small>
              </div>
            </div>
          }
          checked={theme === "light"}
          onChange={() => handleThemeChange("light")}
          className="mb-3"
        />

        <Form.Check
          type="radio"
          id="theme-dark"
          name="theme-selection"
          label={
            <div className="d-flex align-items-center">
              <span className="me-2" role="img" aria-hidden="true">
                🌙
              </span>
              <div>
                <div className="fw-semibold">{t("theme.dark", "Dark")}</div>
                <small className="text-muted">
                  {t("theme.darkDescription", "Easy on the eyes")}
                </small>
              </div>
            </div>
          }
          checked={theme === "dark"}
          onChange={() => handleThemeChange("dark")}
          className="mb-3"
        />

        <Form.Check
          type="radio"
          id="theme-system"
          name="theme-selection"
          label={
            <div className="d-flex align-items-center">
              <span className="me-2" role="img" aria-hidden="true">
                💻
              </span>
              <div>
                <div className="fw-semibold">{t("theme.system", "System")}</div>
                <small className="text-muted">
                  {t("theme.systemDescription", "Follows your device settings")}
                </small>
              </div>
            </div>
          }
          checked={theme === "system"}
          onChange={() => handleThemeChange("system")}
          className="mb-3"
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClose}
        >
          {t("common.close", "Close")}
        </button>
      </Modal.Footer>
    </Modal>
  );
});

export default ThemeSettingsModal;
