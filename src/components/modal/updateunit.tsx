import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { UpdateUnitModalProps } from "../../utils/interface";
import GenericInputField from "../form/input";
import ModalSubmitButton from "../form/submit";
import HelpButton from "../navigation/help";
import { callFunction } from "../../utils/pocketbase";
import GenericButton from "../navigation/button";

const UpdateUnit = NiceModal.create(
  ({
    mapId,
    mapName,
    unitNo,
    unitSequence,
    totalUnits,
    unitDisplay
  }: UpdateUnitModalProps) => {
    const { t } = useTranslation();
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
          <Modal.Title>{t("unit.updateTitle", { unitDisplay })}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.ADD_PUBLIC_UNIT} />
        </Modal.Header>
        <Form onSubmit={handleUpdateUnit}>
          <Modal.Body>
            <GenericInputField
              inputType="number"
              label={t("unit.sequenceNumberLabel")}
              name="sequence"
              placeholder={t("unit.sequenceNumberPlaceholder")}
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
            <GenericButton
              variant="secondary"
              onClick={() => modal.hide()}
              label={t("common.close")}
            />
            <GenericButton
              variant="secondary"
              onClick={() => {
                const hasOnlyOneUnitNumber = totalUnits === 1;
                if (hasOnlyOneUnitNumber) {
                  alert(t("unit.requireOneUnitValidation"));
                  return;
                }
                const confirmDelete = window.confirm(
                  t("unit.confirmDelete", { unitNo, mapName })
                );
                if (confirmDelete) {
                  handleUnitDelete(mapId, unitNo);
                  modal.hide();
                }
              }}
              label={t("unit.deleteUnitButton")}
            />
            <ModalSubmitButton isSaving={isSaving} />
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default UpdateUnit;
