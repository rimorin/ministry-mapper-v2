import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { firestore } from "../../firebase";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import { NewTerritoryCodeModalProps } from "../../utils/interface";
import { getDocs, collection, where, query, addDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
// import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const NewTerritoryCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation
  }: NewTerritoryCodeModalProps) => {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleCreateTerritory = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      setIsSaving(true);
      try {
        const territory = await getDocs(
          query(
            collection(firestore, `congregations/${congregation}/territories`),
            where("code", "==", code)
          )
        );

        if (!territory.empty) {
          alert(`Territory code, ${code}, already exists.`);
          return;
        }

        await addDoc(
          collection(firestore, `congregations/${congregation}/territories`),
          {
            code: code,
            name: name
          }
        );
        alert(`Created territory, ${name}.`);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        <DialogTitle>Create New Territory</DialogTitle>
        <form onSubmit={handleCreateTerritory}>
          <DialogContent>
            <GenericInputField
              label="Territory Code"
              name="code"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                if (!IsValidTerritoryCode(value)) {
                  return;
                }
                setCode(value);
              }}
              changeValue={code}
              required={true}
              placeholder={"Territory code. For eg, M01, W12, etc."}
            />
            <GenericInputField
              label="Name"
              name="name"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setName(value);
              }}
              changeValue={name}
              required={true}
              placeholder={
                "Name of the territory. For eg, 801-810, Woodlands Drive."
              }
            />
          </DialogContent>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </form>
      </Dialog>
    );
  }
);

export default NewTerritoryCode;
