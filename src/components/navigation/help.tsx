import { HelpButtonProps } from "../../utils/interface";
import { Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const HelpButton = ({ link, isWarningButton = false }: HelpButtonProps) => {
  const { t } = useTranslation();

  return (
    <Image
      src={getAssetUrl("question.svg")}
      alt={t("navigation.help", "Help")}
      className={`help-button ${isWarningButton ? "warning-help-button" : ""}`}
      onClick={() => window.open(link)}
    />
  );
};

export default HelpButton;
