import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { ChangeTerritoryNameModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const ChangeTerritoryName = NiceModal.create(
  ({
    name,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    territoryCode
  }: ChangeTerritoryNameModalProps) => {
    const [territoryName, setTerritoryName] = useState(name);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleUpdateTerritoryName = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await updateDataById(
          "territories",
          territoryCode,
          { description: territoryName },
          {
            requestKey: `update-territory-name-${territoryCode}`
          }
        );
        modal.resolve(territoryName);
        modal.hide();
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Change Territory Name</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CHANGE_TERRITORY_NAME} />
        </Modal.Header>
        <Form onSubmit={handleUpdateTerritoryName}>
          <Modal.Body>
            <GenericInputField
              label="Name"
              name="name"
              handleChange={(event) => {
                const { value } = event.target as HTMLInputElement;
                setTerritoryName(value);
              }}
              changeValue={territoryName}
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

export default ChangeTerritoryName;
