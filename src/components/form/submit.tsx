import { Spinner } from "react-bootstrap";
import { SubmitBtnProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import GenericButton from "../navigation/button";

const ModalSubmitButton = ({
  isSaving = false,
  btnLabel,
  disabled = false
}: SubmitBtnProps) => {
  const { t } = useTranslation();
  return (
    <GenericButton
      type="submit"
      variant="primary"
      disabled={isSaving || disabled}
      label={
        <>
          {isSaving && (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              aria-hidden="true"
            />
          )}{" "}
          {btnLabel ? btnLabel : t("common.save")}
        </>
      }
    />
  );
};

export default ModalSubmitButton;
