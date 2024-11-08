import { Modal, Button } from "react-bootstrap";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { FooterProps } from "../../utils/interface";
import ModalSubmitButton from "../form/submit";
import ComponentAuthorizer from "../navigation/authorizer";

const ModalFooter = ({
  handleClick,
  //Default to conductor access lvl so that individual slips can be writable.
  userAccessLevel = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
  requiredAcLForSave = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
  isSaving = false,
  submitLabel = "Save",
  disableSubmitBtn = false,
  children
}: FooterProps) => {
  return (
    <Modal.Footer className="justify-content-around">
      <Button variant="secondary" onClick={handleClick}>
        Close
      </Button>
      {children}
      <ComponentAuthorizer
        requiredPermission={
          requiredAcLForSave
            ? requiredAcLForSave
            : USER_ACCESS_LEVELS.CONDUCTOR.CODE
        }
        userPermission={userAccessLevel}
      >
        <ModalSubmitButton
          isSaving={isSaving}
          btnLabel={submitLabel}
          disabled={disableSubmitBtn}
        />
      </ComponentAuthorizer>
    </Modal.Footer>
  );
};

export default ModalFooter;
