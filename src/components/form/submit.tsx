import { Button, Spinner } from "react-bootstrap";
import { SubmitBtnProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const ModalSubmitButton = ({
  isSaving = false,
  btnLabel = "common.save",
  disabled = false
}: SubmitBtnProps) => {
  const { t } = useTranslation();
  return (
    <Button type="submit" variant="primary" disabled={isSaving || disabled}>
      {isSaving && (
        <Spinner as="span" animation="border" size="sm" aria-hidden="true" />
      )}{" "}
      {btnLabel ? btnLabel : t("common.save")}
    </Button>
  );
};

export default ModalSubmitButton;
