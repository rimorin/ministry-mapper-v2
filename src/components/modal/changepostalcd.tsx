import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { firestore } from "../../firebase";
import { ChangeAddressPostalCodeModalProps } from "../../utils/interface";
import { doc, updateDoc } from "firebase/firestore";
import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const ChangeAddressPostalCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    mapId,
    postalCode
  }: ChangeAddressPostalCodeModalProps) => {
    const [newPostalCode, setNewPostalCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleUpdatePostalcode = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        updateDoc(doc(firestore, `congregations/${congregation}/maps`, mapId), {
          postalCode: newPostalCode
        });
        modal.resolve(newPostalCode);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal open={modal.visible} onClose={() => modal.hide()}>
        <ModalDialog>
          <DialogTitle>Change Address Postal Code</DialogTitle>
          <form onSubmit={handleUpdatePostalcode}>
            <DialogContent>
              <GenericInputField
                inputType="number"
                label="Existing Postal Code"
                name="existingcode"
                changeValue={postalCode}
                required={false}
                readOnly={true}
              />
              <GenericInputField
                inputType="number"
                label="New Postal Code"
                name="postalcode"
                handleChange={(e: ChangeEvent<HTMLElement>) => {
                  const { value } = e.target as HTMLInputElement;
                  setNewPostalCode(value);
                }}
                changeValue={newPostalCode}
                required={true}
                placeholder={
                  "Block/Building postal code. Eg, 730801, 752367, etc"
                }
              />
            </DialogContent>
            <ModalFooter
              handleClick={modal.hide}
              userAccessLevel={footerSaveAcl}
              isSaving={isSaving}
              submitLabel="Change"
            />
          </form>
        </ModalDialog>
      </Modal>
    );
  }
);

export default ChangeAddressPostalCode;
