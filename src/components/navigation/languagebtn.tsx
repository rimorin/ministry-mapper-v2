import { FC, use } from "react";
import { Button, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { ThemeContext } from "../utils/context";

interface LanguageBtnProps {
  onClick: () => void;
  className?: string;
}

const LanguageBtn: FC<LanguageBtnProps> = ({ onClick, className = "" }) => {
  const { t } = useTranslation();
  const { actualTheme } = use(ThemeContext);

  return (
    <Button
      variant="outline-primary"
      size="sm"
      onClick={onClick}
      className={className}
      aria-label={t("common.Language", "Language")}
      title={t("common.Language", "Language")}
    >
      <Image
        src={getAssetUrl("language.svg")}
        alt=""
        aria-hidden="true"
        style={{
          width: "1.25em",
          height: "1.25em",
          filter: actualTheme === "dark" ? "brightness(0) invert(1)" : "none"
        }}
      />
    </Button>
  );
};

export default LanguageBtn;
