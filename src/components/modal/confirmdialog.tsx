import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ConfirmDialogProps } from "../../utils/interface";

const ConfirmDialog = NiceModal.create(
  ({
    title,
    message,
    confirmText,
    cancelText,
    variant = "danger",
    focusConfirm = false
  }: ConfirmDialogProps) => {
    const modal = useModal();
    const { t } = useTranslation();

    const handleConfirm = () => {
      modal.resolve(true);
      modal.hide();
    };

    const handleCancel = () => {
      modal.resolve(false);
      modal.hide();
    };

    return (
      <Modal
        {...bootstrapDialog(modal)}
        onHide={handleCancel}
        centered
        backdrop="static"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <Modal.Header closeButton>
          <Modal.Title id="confirm-dialog-title">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p
            id="confirm-dialog-message"
            className="mb-0"
            style={{ whiteSpace: "pre-line" }}
          >
            {message}
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-around">
          <Button
            variant="secondary"
            onClick={handleCancel}
            autoFocus={!focusConfirm}
          >
            {cancelText || t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            autoFocus={focusConfirm}
          >
            {confirmText || t("common.confirm", "Confirm")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
);

export default ConfirmDialog;
