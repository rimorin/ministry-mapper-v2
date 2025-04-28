import { memo } from "react";
import { Fade, Image } from "react-bootstrap";
import { backToTopProp } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const BackToTopButton = memo(({ showButton }: backToTopProp) => {
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
          src="https://assets.ministry-mapper.com/top-arrow.svg"
          alt={t("navigation.backToTop", "Back to top")}
        />
      </div>
    </Fade>
  );
});

export default BackToTopButton;
