import { AspectRatio } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  CardActions
} from "@mui/material";
import { SignInDifferentProps } from "../../utils/interface";
import UseAnotherButton from "../navigation/useanother";
// import {
//   Box,
//   AspectRatio,
//   CardContent,
//   Stack,
//   Typography,
//   CardActions,
//   Card
// } from "@mui/joy";

const UnauthorizedPage = ({ handleClick, name }: SignInDifferentProps) => (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <Card
      // variant="plain"
      sx={{
        width: "90%",
        maxWidth: "100%"
      }}
    >
      <AspectRatio
        // color="neutral"
        // variant="plain"
        // ratio="1"
        sx={{
          width: 90,
          margin: "auto"
        }}
      >
        <img src="/android-chrome-192x192.png" alt="" />
      </AspectRatio>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography variant="subtitle1">
            401 Unauthorized Access 🔐
          </Typography>
          <Typography variant="body1">
            We are sorry {name}! You are not authorised to access the system.
            Please approach your respective administrators for assistance.
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <UseAnotherButton handleClick={handleClick} />
      </CardActions>
    </Card>
  </Box>
);

export default UnauthorizedPage;
