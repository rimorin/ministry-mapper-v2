import { Button, DialogActions } from "@mui/material";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { FooterProps } from "../../utils/interface";
import ModalSubmitButton from "../form/submit";
import ComponentAuthorizer from "../navigation/authorizer";
// import { Button, DialogActions } from "@mui/joy";

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
    <DialogActions
      sx={{
        width: "100%",
        justifyContent: "center",
        flex: "0 1 200px"
      }}
    >
      {children && children}
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
      <Button onClick={handleClick}>Close</Button>
    </DialogActions>
  );
};

export default ModalFooter;
