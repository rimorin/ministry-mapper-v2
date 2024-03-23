// import {
//   ColorPaletteProp,
//   Snackbar,
//   SnackbarPropsColorOverrides
// } from "@mui/joy";

import { Snackbar } from "@mui/material";

const AlertComponent = ({
  message,
  color,
  open
}: {
  message: string;
  color: string;
  open: boolean;
}) => {
  return (
    <Snackbar
      autoHideDuration={5000}
      open={open}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center"
      }}
      color={color}
    >
      <>{message}</>
    </Snackbar>
  );
};

export default AlertComponent;
