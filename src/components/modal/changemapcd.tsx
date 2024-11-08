import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { pb } from "../../utils/pocketbase";
import { ChangeAddressMapCodeModalProps } from "../../utils/interface";

const ChangeMapCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    mapCode
  }: ChangeAddressMapCodeModalProps) => {
    const [newMapCode, setNewMapCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleUpdateMapCode = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (newMapCode === mapCode) {
        alert("Please enter a new map number");
        return;
      }
      setIsSaving(true);
      try {
        await pb.collection("maps").update(
          mapId,
          {
            code: newMapCode
          },
          {
            requestKey: `update-map-code-${mapId}`
          }
        );
        modal.resolve();
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Change Map Number</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CHANGE_TERRITORY_CODE} />
        </Modal.Header>
        <Form onSubmit={handleUpdateMapCode}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="userid">Existing Map Number</Form.Label>
              <Form.Control readOnly id="existingcode" defaultValue={mapCode} />
            </Form.Group>
            <GenericInputField
              inputType="number"
              label="New Map Number"
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
            submitLabel="Change"
          />
        </Form>
      </Modal>
    );
  }
);

export default ChangeMapCode;
