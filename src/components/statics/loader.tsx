// import { Box, CircularProgress } from "@mui/joy";

import { Box, CircularProgress } from "@mui/material";

const Loader = () => (
  <Box
    // className="d-flex align-items-center justify-content-center vh-100"
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh"
    }}
  >
    <CircularProgress />
  </Box>
);

export default Loader;
