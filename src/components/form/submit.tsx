import { Button } from "@mui/joy";
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
      loading={isSaving}
    >
      {btnLabel}
    </Button>
  );
};

export default ModalSubmitButton;
