import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { firestore } from "../../firebase";
import { USER_ACCESS_LEVELS, NOTIFICATION_TYPES } from "../../utils/constants";
import ModalFooter from "../form/footer";
import GenericTextAreaField from "../form/textarea";
import { UpdateAddressFeedbackModalProps } from "../../utils/interface";
import { updateDoc, doc } from "firebase/firestore";
import errorHandler from "../../utils/helpers/errorhandler";
import setNotification from "../../utils/helpers/setnotification";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
// import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const UpdateAddressFeedback = NiceModal.create(
  ({
    name,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    congregation,
    currentFeedback = "",
    currentName = ""
  }: UpdateAddressFeedbackModalProps) => {
    const [feedback, setFeedback] = useState(currentFeedback);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleSubmitFeedback = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await updateDoc(
          doc(firestore, `congregations/${congregation}/maps`, mapId),
          {
            feedback: feedback
          }
        );
        await setNotification(
          NOTIFICATION_TYPES.FEEDBACK,
          congregation,
          mapId,
          currentName
        );
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      // <Modal open={modal.visible} onClose={() => modal.remove()}>
      <Dialog open={modal.visible} onClose={() => modal.remove()}>
        <DialogTitle>{`Feedback on ${name}`}</DialogTitle>
        <DialogContent>
          <GenericTextAreaField
            name="feedback"
            rows={5}
            handleChange={(event) => {
              const { value } = event.target as HTMLInputElement;
              setFeedback(value);
            }}
            changeValue={feedback}
          />
        </DialogContent>
        <form onSubmit={handleSubmitFeedback}>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </form>
      </Dialog>
      // </Modal>
    );
  }
);

export default UpdateAddressFeedback;
