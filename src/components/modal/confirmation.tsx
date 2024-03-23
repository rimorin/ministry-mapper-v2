import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ConfirmationModalProps } from "../../utils/interface";
// import {
//   Button,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Modal,
//   ModalDialog,
//   Typography
// } from "@mui/joy";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@mui/material";
const ConfirmationDialog = NiceModal.create(
  ({ title, message }: ConfirmationModalProps) => {
    const modal = useModal();

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Typography>{message}</Typography>
        </DialogContent>
        <DialogActions
          sx={{
            width: "100%",
            justifyContent: "center",
            flex: "0 1 200px" // this is equivalent to buttonFlex
          }}
        >
          <Button
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
            // color="neutral"
            onClick={() => modal.hide()}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

export default ConfirmationDialog;
