import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import { SubmitBtnProps } from "../../utils/interface";

const ModalSubmitButton = ({
  isSaving = false,
  btnLabel,
  disabled = false
}: SubmitBtnProps) => {
  const { t } = useTranslation();

  return (
    <Button type="submit" disabled={isSaving || disabled}>
      {isSaving && <Spinner data-icon="inline-start" aria-hidden="true" />}
      {btnLabel ?? t("common.save")}
    </Button>
  );
};

export default ModalSubmitButton;
