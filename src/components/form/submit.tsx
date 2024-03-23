// import { Button } from "@mui/joy";
import { Button, CircularProgress } from "@mui/material";
import { SubmitBtnProps } from "../../utils/interface";

const ModalSubmitButton = ({
  isSaving = false,
  btnLabel = "Save",
  disabled = false
}: SubmitBtnProps) => {
  return (
    <Button
      type="submit"
      color="primary"
      disabled={isSaving || disabled}
      // loading={isSaving}
      endIcon={isSaving && <CircularProgress size={20} />}
    >
      {btnLabel}
    </Button>
  );
};

export default ModalSubmitButton;
