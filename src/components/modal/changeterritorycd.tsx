import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import { ChangeTerritoryCodeModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const ChangeTerritoryCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    territoryCode,
    territoryId
  }: ChangeTerritoryCodeModalProps) => {
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const [newTerritoryCode, setNewTerritoryCode] = useState(territoryCode);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleUpdateTerritoryCode = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await updateDataById(
          "territories",
          territoryId,
          { code: newTerritoryCode },
          {
            requestKey: `update-territory-code-${territoryId}`
          }
        );
        modal.resolve(newTerritoryCode);
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
            {t("territory.changeCode", "Change Territory Code")}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CHANGE_TERRITORY_CODE} />
        </Modal.Header>
        <Form onSubmit={handleUpdateTerritoryCode}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="userid">
                {t(
                  "territory.existingTerritoryCode",
                  "Existing Territory Code"
                )}
              </Form.Label>
              <Form.Control
                readOnly
                id="existingcode"
                defaultValue={territoryCode}
              />
            </Form.Group>
            <GenericInputField
              label={t("territory.newTerritoryCode", "New Territory Code")}
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
              placeholder={t(
                "territory.codeExample",
                "Territory code. For eg, M01, W12, etc."
              )}
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

export default ChangeTerritoryCode;
