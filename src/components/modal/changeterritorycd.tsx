import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { firestore } from "../../firebase";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import { ChangeTerritoryCodeModalProps } from "../../utils/interface";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  doc
} from "firebase/firestore";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
// import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const ChangeTerritoryCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    territoryId
  }: ChangeTerritoryCodeModalProps) => {
    const [newTerritoryCode, setNewTerritoryCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleUpdateTerritoryCode = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      console.log(`congregation: ${congregation}, territoryId: ${territoryId}`);
      try {
        const territory = await getDocs(
          query(
            collection(firestore, `congregations/${congregation}/territories`),
            where("code", "==", newTerritoryCode)
          )
        );

        if (!territory.empty) {
          alert(`Territory code, ${newTerritoryCode}, already exists.`);
          return;
        }
        await updateDoc(
          doc(
            firestore,
            `congregations/${congregation}/territories/${territoryId}`
          ),
          {
            code: newTerritoryCode
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
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog> */}
        <DialogTitle>Change Territory Code</DialogTitle>
        <form onSubmit={handleUpdateTerritoryCode}>
          <DialogContent>
            {/* <Form.Group className="mb-3">
                <Form.Label htmlFor="userid">
                  Existing Territory Code
                </Form.Label>
                <Form.Control
                  readOnly
                  id="existingcode"
                  defaultValue={territoryCode}
                />
              </Form.Group> */}
            <GenericInputField
              label="Existing Territory Code"
              name="existingcode"
              changeValue={territoryCode}
              readOnly={true}
            />
            <GenericInputField
              label="New Territory Code"
              name="code"
              handleChange={(event: ChangeEvent<HTMLElement>) => {
                const { value } = event.target as HTMLInputElement;
                if (!IsValidTerritoryCode(value)) {
                  return;
                }
                setNewTerritoryCode(value);
              }}
              changeValue={newTerritoryCode}
              required={true}
              placeholder={"Territory code. For eg, M01, W12, etc."}
            />
          </DialogContent>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </form>
        {/* </ModalDialog> */}
      </Dialog>
    );
  }
);

export default ChangeTerritoryCode;
