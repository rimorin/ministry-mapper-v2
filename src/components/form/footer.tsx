import { Modal, Button } from "react-bootstrap";
import { USER_ACCESS_LEVELS, TERRITORY_TYPES } from "../../utils/constants";
import { FooterProps } from "../../utils/interface";
import ModalSubmitButton from "../form/submit";
import ComponentAuthorizer from "../navigation/authorizer";
import GetDirection from "../../utils/helpers/directiongenerator";

const ModalFooter = ({
  propertyCoordinates,
  handleClick,
  handleDelete,
  type,
  //Default to conductor access lvl so that individual slips can be writable.
  userAccessLevel = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
  requiredAcLForSave = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
  isSaving = false,
  submitLabel = "Save",
  disableSubmitBtn = false
}: FooterProps) => {
  return (
    <Modal.Footer className="justify-content-around">
      {type && type === TERRITORY_TYPES.SINGLE_STORY ? (
        <>
          <ComponentAuthorizer
            requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            userPermission={userAccessLevel}
          >
            <Button variant="secondary" onClick={handleDelete}>
              Delete Property
            </Button>
          </ComponentAuthorizer>
          {propertyCoordinates && (
            <Button
              variant="secondary"
              onClick={() =>
                window.open(GetDirection(propertyCoordinates), "_blank")
              }
            >
              Direction
            </Button>
          )}
        </>
      ) : (
        <></>
      )}
      <Button variant="secondary" onClick={handleClick}>
        Close
      </Button>
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
