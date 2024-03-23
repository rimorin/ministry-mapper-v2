// import {
//   AspectRatio,
//   Box,
//   Card,
//   CardActions,
//   CardContent,
//   Link,
//   Stack,
//   Typography
// } from "@mui/joy";
import { AspectRatio } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  CardActions,
  Link
} from "@mui/material";
import { VerificationProps } from "../../utils/interface";
import UseAnotherButton from "./useanother";

const VerificationPage = ({
  handleClick,
  handleResendMail,
  name
}: VerificationProps) => (
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
          <Typography variant="body2">
            We are sorry {name}! Please verify your email account before
            proceeding 🪪
          </Typography>
          <Link onClick={handleResendMail} underline="hover">
            <Typography variant="body2">
              Didn&#39;t receive verification email ?
            </Typography>
          </Link>
        </Stack>
      </CardContent>
      <CardActions>
        <UseAnotherButton handleClick={handleClick} />
      </CardActions>
    </Card>
  </Box>
);

export default VerificationPage;
