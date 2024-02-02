import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { firestore } from "../../firebase";
import {
  WIKI_CATEGORIES,
  USER_ACCESS_LEVELS,
  NOTIFICATION_TYPES
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import GenericTextAreaField from "../form/textarea";
import HelpButton from "../navigation/help";
import { UpdateAddressInstructionsModalProps } from "../../utils/interface";
import { doc, updateDoc } from "firebase/firestore";
import setNotification from "../../utils/helpers/setnotification";

const UpdateAddressInstructions = NiceModal.create(
  ({
    congregation,
    mapId,
    addressName,
    userAccessLevel,
    instructions,
    userName
  }: UpdateAddressInstructionsModalProps) => {
    const modal = useModal();
    const rollbar = useRollbar();
    const [addressInstructions, setAddressInstructions] =
      useState(instructions);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmitInstructions = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      try {
        // TODO: Update to use Firestore
        updateDoc(doc(firestore, `congregations/${congregation}/maps`, mapId), {
          instructions: addressInstructions
        });
        await setNotification(
          NOTIFICATION_TYPES.INSTRUCTIONS,
          congregation,
          mapId,
          userName
        );
        modal.resolve(addressInstructions);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal {...bootstrapDialog(modal)}>
        <Modal.Header>
          <Modal.Title>{`Instructions on ${addressName}`}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.UPDATE_INSTRUCTIONS} />
        </Modal.Header>
        <Form onSubmit={handleSubmitInstructions}>
          <Modal.Body>
            <GenericTextAreaField
              name="instructions"
              rows={5}
              handleChange={(event) => {
                const { value } = event.target as HTMLInputElement;
                setAddressInstructions(value);
              }}
              changeValue={addressInstructions}
              readOnly={
                userAccessLevel !== USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
              }
            />
          </Modal.Body>
          <ModalFooter
            handleClick={() => modal.hide()}
            userAccessLevel={userAccessLevel}
            requiredAcLForSave={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default UpdateAddressInstructions;
