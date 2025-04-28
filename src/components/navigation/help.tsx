import { memo } from "react";
import { HelpButtonProps } from "../../utils/interface";
import { Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const HelpButton = memo(
  ({ link, isWarningButton = false }: HelpButtonProps) => {
    const { t } = useTranslation();

    return (
      <Image
        src="https://assets.ministry-mapper.com/question.svg"
        alt={t("navigation.help", "Help")}
        className={`help-button ${isWarningButton ? "warning-help-button" : ""}`}
        onClick={() => window.open(link)}
      />
    );
  }
);

export default HelpButton;
