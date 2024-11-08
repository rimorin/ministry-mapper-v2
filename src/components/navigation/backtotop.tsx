import { memo } from "react";
import { Fade, Image } from "react-bootstrap";
import { backToTopProp } from "../../utils/interface";

const BackToTopButton = memo(({ showButton }: backToTopProp) => (
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
        alt="Back to top"
      />
    </div>
  </Fade>
));

export default BackToTopButton;
