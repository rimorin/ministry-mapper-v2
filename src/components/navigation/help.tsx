import { memo } from "react";
import { HelpButtonProps } from "../../utils/interface";
import { Image } from "react-bootstrap";
const HelpButton = memo(
  ({ link, isWarningButton = false }: HelpButtonProps) => (
    <Image
      src="https://assets.ministry-mapper.com/question.svg"
      alt="Help"
      className={`help-button ${isWarningButton ? "warning-help-button" : ""}`}
      onClick={() => window.open(link)}
    />
  )
);

export default HelpButton;
