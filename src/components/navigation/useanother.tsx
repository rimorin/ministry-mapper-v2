import { Button } from "react-bootstrap";
import { SignInDifferentProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const UseAnotherButton = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();

  return (
    <Button variant="secondary" onClick={handleClick}>
      {t("auth.useAnotherAccount", "Use Another Account")}
    </Button>
  );
};

export default UseAnotherButton;
