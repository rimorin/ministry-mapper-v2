import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ConfirmationModalProps } from "../../utils/interface";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
  ModalDialog,
  Typography
} from "@mui/joy";
const ConfirmationDialog = NiceModal.create(
  ({ title, message }: ConfirmationModalProps) => {
    const modal = useModal();

    return (
      <Modal open={modal.visible} onClose={() => modal.hide()}>
        <ModalDialog>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>{message}</DialogContent>
          <DialogActions
            buttonFlex="0 1 200px"
            sx={{ width: "100%", justifyContent: "center" }}
          >
            <Button
              variant="solid"
              color="primary"
              onClick={() => {
                modal.resolve(true);
                modal.hide();
              }}
            >
              Ok
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => modal.hide()}
            >
              Cancel
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    );
  }
);

export default ConfirmationDialog;
