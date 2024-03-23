import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { firestore } from "../../firebase";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import { ChangeAddressNameModalProps } from "../../utils/interface";
import { doc, updateDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
// import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const ChangeAddressName = NiceModal.create(
  ({
    name,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    congregation
  }: ChangeAddressNameModalProps) => {
    const [addressName, setAddressName] = useState(name);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleUpdateBlockName = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await updateDoc(
          doc(firestore, `congregations/${congregation}/maps`, mapId),
          {
            name: addressName
          }
        );
        modal.resolve(addressName);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog> */}
        <DialogTitle>Change Address Name</DialogTitle>
        <DialogContent>
          <form onSubmit={handleUpdateBlockName}>
            <GenericInputField
              name="name"
              handleChange={(event) => {
                const { value } = event.target as HTMLInputElement;
                setAddressName(value);
              }}
              changeValue={addressName}
              required={true}
            />
            <ModalFooter
              handleClick={modal.hide}
              userAccessLevel={footerSaveAcl}
              isSaving={isSaving}
            />
          </form>
        </DialogContent>
        {/* </ModalDialog> */}
      </Dialog>
    );
  }
);

export default ChangeAddressName;
