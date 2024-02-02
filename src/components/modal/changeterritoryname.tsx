import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { firestore } from "../../firebase";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { ChangeTerritoryNameModalProps } from "../../utils/interface";
import { doc, updateDoc } from "firebase/firestore";
import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const ChangeTerritoryName = NiceModal.create(
  ({
    name,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryId
  }: ChangeTerritoryNameModalProps) => {
    const [territoryName, setTerritoryName] = useState(name);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleUpdateTerritoryName = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await updateDoc(
          doc(
            firestore,
            `congregations/${congregation}/territories/${territoryId}`
          ),
          {
            name: territoryName
          }
        );
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
          <DialogTitle>Change Territory Name</DialogTitle>
          <form onSubmit={handleUpdateTerritoryName}>
            <DialogContent>
              <GenericInputField
                label="Name"
                name="name"
                handleChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setTerritoryName(value);
                }}
                changeValue={territoryName}
                required={true}
              />
            </DialogContent>
            <ModalFooter
              handleClick={modal.hide}
              userAccessLevel={footerSaveAcl}
              isSaving={isSaving}
            />
          </form>
        </ModalDialog>
      </Modal>
    );
  }
);

export default ChangeTerritoryName;
