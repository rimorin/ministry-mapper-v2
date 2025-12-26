import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { USER_ACCESS_LEVELS, TERRITORY_TYPES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { NewUnitModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import { callFunction } from "../../utils/pocketbase";

const NewUnit = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    addressData
  }: NewUnitModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const [unit, setUnit] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleCreateNewUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (!/^[a-zA-Z0-9\-*]+$/.test(unit)) {
          notifyWarning(t("unit.alphanumericDashHyphenValidation"));
          return;
        }
        await callFunction("/map/code/add", {
          method: "POST",
          body: {
            map: mapId,
            code: unit
          }
        });
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {addressData.type === TERRITORY_TYPES.SINGLE_STORY
              ? t("unit.addPropertyTitle", { name: addressData.name })
              : t("unit.addUnitTitle", { mapId: mapId })}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateNewUnit}>
          <Modal.Body>
            <GenericInputField
              label={
                addressData.type === TERRITORY_TYPES.SINGLE_STORY
                  ? t("unit.propertyNumberLabel")
                  : t("unit.unitNumberLabel")
              }
              name="unit"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setUnit(value);
              }}
              changeValue={unit}
              required={true}
            />
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default NewUnit;
