import { memo } from "react";
import { backToTopProp } from "../../utils/interface";
import { ReactComponent as TopArrowImage } from "../../assets/top-arrow.svg";
import { IconButton } from "@mui/material";
// import { IconButton } from "@mui/joy";

const BackToTopButton = memo(({ showButton }: backToTopProp) => (
  <>
    {showButton && (
      <IconButton
        // variant="plain"
        // color="neutral"
        size="small"
        sx={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          cursor: "pointer"
        }}
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }}
      >
        <TopArrowImage />
      </IconButton>
    )}
  </>
));

export default BackToTopButton;
