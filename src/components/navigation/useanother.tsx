import { SignInDifferentProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import GenericButton from "./button";

const UseAnotherButton = ({ handleClick }: SignInDifferentProps) => {
  const { t } = useTranslation();

  return (
    <GenericButton
      variant="secondary"
      onClick={handleClick}
      label={t("auth.useAnotherAccount", "Use Another Account")}
    />
  );
};

export default UseAnotherButton;
