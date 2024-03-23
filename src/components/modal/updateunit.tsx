import NiceModal, { useModal } from "@ebay/nice-modal-react";
import ModalManager from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent, useContext } from "react";
import { firestore } from "../../firebase";
import { MULTI_BATCH_ACTIONS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import {
  AlertSnackbarProps,
  UpdateUnitModalProps
} from "../../utils/interface";
import GenericInputField from "../form/input";
import { collection, where, query } from "firebase/firestore";
import MultiBatchHandler from "../../utils/helpers/multibatchupdate";
// import {
//   Button,
//   DialogContent,
//   DialogTitle,
//   Modal,
//   ModalDialog
// } from "@mui/joy";
import ModalFooter from "../form/footer";
import { AlertContext } from "../utils/context";
import processPostalUnitNumber from "../../utils/helpers/processpostalno";
import ConfirmationDialog from "./confirmation";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";

const UpdateUnit = NiceModal.create(
  ({
    congregation,
    mapId,
    name,
    unitNo,
    unitSequence,
    unitLength,
    unitDisplay,
    addressData
  }: UpdateUnitModalProps) => {
    const [unitSeq, setUnitSeq] = useState<number | undefined>(unitSequence);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();
    const { setSnackbarAlert } = useContext(AlertContext) as AlertSnackbarProps;

    const processPostalUnitSequence = async (
      mapId: string,
      unitNumber: string,
      sequence: number | undefined
    ) => {
      if (!addressData) return;

      setIsSaving(true);
      try {
        await MultiBatchHandler(
          query(
            collection(firestore, `congregations/${congregation}/addresses`),
            where("number", "==", unitNumber),
            where("map", "==", mapId)
          ),
          MULTI_BATCH_ACTIONS.UPDATE,
          { sequence: sequence }
        );

        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    const handleUpdateUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      processPostalUnitSequence(mapId, unitNo, unitSeq);
    };
    console.log(
      `UpdateUnit: unitNo: ${unitNo}, unitDisplay: ${unitDisplay}, unitSequence: ${unitSequence}, unitLength: ${unitLength}`
    );

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        <form onSubmit={handleUpdateUnit}>
          <DialogTitle>Unit {unitDisplay}</DialogTitle>
          <DialogContent>
            <GenericInputField
              inputType="number"
              label="Sequence Number"
              name="sequence"
              placeholder="Optional unit row sequence number"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                const parsedValue = parseInt(value);
                setUnitSeq(isNaN(parsedValue) ? undefined : parsedValue);
              }}
              changeValue={
                unitSeq === undefined ? undefined : unitSeq.toString()
              }
            />
          </DialogContent>
          <ModalFooter isSaving={isSaving} handleClick={modal.remove}>
            <Button
              onClick={() => {
                const hasOnlyOneUnitNumber = unitLength === 1;
                if (hasOnlyOneUnitNumber) {
                  // alert(`Territory requires at least 1 unit number.`);
                  setSnackbarAlert({
                    message: "Territory requires at least 1 unit number.",
                    color: "warning",
                    open: true
                  });
                  return;
                }
                ModalManager.show(ConfirmationDialog, {
                  message: `This action will delete unit number ${unitNo} of ${name}.`
                }).then((result) => {
                  if (result) {
                    processPostalUnitNumber(
                      congregation,
                      mapId,
                      unitNo,
                      addressData,
                      true
                    );
                    modal.hide();
                  }
                });
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </form>
      </Dialog>
    );
  }
);

export default UpdateUnit;
