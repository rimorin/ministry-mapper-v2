import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  WIKI_CATEGORIES
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { NewUnitModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { pb } from "../../utils/pocketbase";

const NewUnit = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    addressData
  }: NewUnitModalProps) => {
    const [unit, setUnit] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleCreateNewUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (!/^[a-zA-Z0-9\-*]+$/.test(unit)) {
          alert(
            "The Unit/Property number should only include alphanumeric characters, dash or hyphen."
          );
          return;
        }
        await pb.send("map/code/add", {
          method: "POST",
          body: {
            map: mapId,
            code: unit
          }
        });
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
          <Modal.Title>
            {`Add ${
              addressData.type === TERRITORY_TYPES.SINGLE_STORY
                ? "property"
                : "unit"
            } to ${
              addressData.type === TERRITORY_TYPES.SINGLE_STORY
                ? addressData.name
                : mapId
            }`}
          </Modal.Title>
          {addressData.type === TERRITORY_TYPES.SINGLE_STORY ? (
            <HelpButton link={WIKI_CATEGORIES.ADD_DELETE_PRIVATE_PROPERTY} />
          ) : (
            <HelpButton link={WIKI_CATEGORIES.ADD_PUBLIC_UNIT} />
          )}
        </Modal.Header>
        <Form onSubmit={handleCreateNewUnit}>
          <Modal.Body>
            <GenericInputField
              label={`${
                addressData.type === TERRITORY_TYPES.SINGLE_STORY
                  ? "Property"
                  : "Unit"
              } number`}
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
