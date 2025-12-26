import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import { ChangeAddressNameModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const ChangeAddressName = NiceModal.create(
  ({
    name,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId
  }: ChangeAddressNameModalProps) => {
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const [addressName, setAddressName] = useState(name);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleUpdateBlockName = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await updateDataById(
          "maps",
          mapId,
          { description: addressName },
          {
            requestKey: `update-map-desc-${mapId}`
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
            {t("address.changeName", "Change Address Name")}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateBlockName}>
          <Modal.Body>
            <GenericInputField
              label={t("address.name", "Name")}
              name="name"
              handleChange={(event) => {
                const { value } = event.target as HTMLInputElement;
                setAddressName(value);
              }}
              changeValue={addressName}
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

export default ChangeAddressName;
