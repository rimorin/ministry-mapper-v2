import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { ChangeAddressMapCodeModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const ChangeMapCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    mapCode
  }: ChangeAddressMapCodeModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const [newMapCode, setNewMapCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleUpdateMapCode = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (newMapCode === mapCode) {
        notifyWarning(
          t("map.enterNewMapNumber", "Please enter a new map number")
        );
        return;
      }
      setIsSaving(true);
      try {
        await updateDataById(
          "maps",
          mapId,
          { code: newMapCode },
          {
            requestKey: `update-map-code-${mapId}`
          }
        );
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
            {t("address.changeMapNumber", "Change Map Number")}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CHANGE_TERRITORY_CODE} />
        </Modal.Header>
        <Form onSubmit={handleUpdateMapCode}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="userid">
                {t("map.existingMapNumber", "Existing Map Number")}
              </Form.Label>
              <Form.Control readOnly id="existingcode" defaultValue={mapCode} />
            </Form.Group>
            <GenericInputField
              inputType="number"
              label={t("map.newMapNumber", "New Map Number")}
              name="refNo"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setNewMapCode(value);
              }}
              changeValue={newMapCode}
              required={true}
            />
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
            submitLabel={t("common.change", "Change")}
          />
        </Form>
      </Modal>
    );
  }
);

export default ChangeMapCode;
