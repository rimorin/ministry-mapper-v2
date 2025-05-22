import { Modal } from "react-bootstrap";
import { FooterProps } from "../../utils/interface";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import ModalSubmitButton from "./submit";
import ComponentAuthorizer from "../navigation/authorizer";
import GenericButton from "../navigation/button";

const ModalFooter = ({
  handleClick,
  //Default to conductor access lvl so that individual slips can be writable.
  userAccessLevel = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
  requiredAcLForSave = USER_ACCESS_LEVELS.CONDUCTOR.CODE,
  isSaving = false,
  submitLabel,
  disableSubmitBtn = false,
  children
}: FooterProps) => {
  const { t } = useTranslation();

  return (
    <Modal.Footer className="justify-content-around">
      <GenericButton
        variant="secondary"
        onClick={handleClick}
        label={t("common.cancel")}
      />
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
          disabled={disableSubmitBtn}
          btnLabel={submitLabel ? submitLabel : t("common.save", "Save")}
        />
      </ComponentAuthorizer>
    </Modal.Footer>
  );
};

export default ModalFooter;
