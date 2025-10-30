import { Fade, Image } from "react-bootstrap";
import { backToTopProp } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const BackToTopButton = ({ showButton }: backToTopProp) => {
  const { t } = useTranslation();

  return (
    <Fade in={showButton}>
      <div
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }}
        className="back-to-top"
      >
        <Image
          src={getAssetUrl("top-arrow.svg")}
          alt={t("navigation.backToTop", "Back to top")}
        />
      </div>
    </Fade>
  );
};

export default BackToTopButton;
