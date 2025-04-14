import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { UpdateUnitModalProps } from "../../utils/interface";
import GenericInputField from "../form/input";
import ModalSubmitButton from "../form/submit";
import HelpButton from "../navigation/help";
import { callFunction } from "../../utils/pocketbase";

const UpdateUnit = NiceModal.create(
  ({
    mapId,
    mapName,
    unitNo,
    unitSequence,
    unitLength,
    unitDisplay
  }: UpdateUnitModalProps) => {
    const [unitSeq, setUnitSeq] = useState<number | undefined>(unitSequence);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const processPostalUnitSequence = async (
      mapId: string,
      unitNumber: string,
      sequence: number | undefined
    ) => {
      setIsSaving(true);
      try {
        await callFunction("/map/code/update", {
          method: "POST",
          body: {
            map: mapId,
            code: unitNumber,
            sequence
          }
        });
        modal.hide();
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleUnitDelete = async (mapId: string, unitNumber: string) => {
      setIsSaving(true);
      try {
        await callFunction("/map/code/delete", {
          method: "POST",
          body: {
            map: mapId,
            code: unitNumber
          }
        });
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleUpdateUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      processPostalUnitSequence(mapId, unitNo, unitSeq);
    };

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Unit {unitDisplay}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.UPDATE_UNIT_NUMBER} />
        </Modal.Header>
        <Form onSubmit={handleUpdateUnit}>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer className="justify-content-around">
            <Button variant="secondary" onClick={() => modal.hide()}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const hasOnlyOneUnitNumber = unitLength === 1;
                if (hasOnlyOneUnitNumber) {
                  alert(`Territory requires at least 1 unit number.`);
                  return;
                }
                const confirmDelete = window.confirm(
                  `⚠️ WARNING: Deleting unit number "${unitNo}" of "${mapName}". This action cannot be undone. Proceed?`
                );
                if (confirmDelete) {
                  handleUnitDelete(mapId, unitNo);
                  modal.hide();
                }
              }}
            >
              Delete Unit
            </Button>
            <ModalSubmitButton isSaving={isSaving} />
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default UpdateUnit;
