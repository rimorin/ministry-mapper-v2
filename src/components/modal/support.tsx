import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from "@mui/material";
// import {
//   Button,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Modal,
//   ModalDialog,
//   Stack,
//   Typography
// } from "@mui/joy";

const { VITE_DONATION_URL } = import.meta.env;
const SupportDialog = NiceModal.create(() => {
  const modal = useModal();

  return (
    <Dialog open={modal.visible} onClose={() => modal.hide()}>
      <DialogTitle>Support Ministry Mapper</DialogTitle>
      <DialogContent sx={{ paddingX: "10px", marginTop: "5px" }}>
        <Stack spacing={1}>
          <Typography variant="body2" textAlign="start">
            I&apos;m glad you&apos;ve found Ministry Mapper helpful! It began as
            a simple tool for my congregation, but word spread, and now others
            benefit too.
          </Typography>
          <Typography variant="body2">
            While Ministry Mapper was initially free, with more congregations
            joining, I&apos;ve received inquiries about contributing to its
            continued development and maintenance.
          </Typography>
          <Typography variant="body2">
            Instead of implementing fees, I&apos;m opening donations.
            Individuals and congregations can now choose an amount they feel
            comfortable contributing.
          </Typography>
          <Typography variant="body2">
            Your donations directly fuel the continuous development of new
            features &amp; ensure the platform&apos;s stability and security.
          </Typography>
          <Typography variant="body2">
            Thank you for considering a donation! It helps ensure Ministry
            Mapper continues serving the needs of congregations like yours.
          </Typography>
          <Typography variant="body2" textAlign="right">
            Your Brother, JE
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{ width: "100%", justifyContent: "center", flex: "0 1 200px" }}
      >
        <Button
          // variant="solid"
          color="primary"
          onClick={() => {
            // open the donation page
            window.open(VITE_DONATION_URL, "_blank");
            modal.hide();
          }}
        >
          Donate
        </Button>
        <Button variant="outlined" onClick={() => modal.hide()}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default SupportDialog;
