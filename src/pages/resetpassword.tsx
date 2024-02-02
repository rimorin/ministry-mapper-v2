import * as React from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel, { formLabelClasses } from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import ColorSchemeToggle from "../components/ColorSchemeToggle";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

interface FormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
}
interface SignInFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

export default function JoySignInSideTemplate({ email }: { email?: string }) {
  const [isLoading, setIsLoading] = React.useState(false);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        maxWidth: "100%",
        px: 2
      }}
    >
      <Box
        component="header"
        sx={{
          py: 3,
          display: "flex",
          alignItems: "left",
          justifyContent: "space-between"
        }}
      >
        <Box sx={{ gap: 2, display: "flex", alignItems: "center" }}>
          <IconButton disabled variant="plain" size="sm">
            <img src="favicon-32x32.png" alt="Ministry Mapper Icon" />
          </IconButton>
          <Typography level="title-lg">Ministry Mapper</Typography>
        </Box>
        <ColorSchemeToggle />
      </Box>
      <Box
        component="main"
        sx={{
          my: "auto",
          py: 2,
          pb: 5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: 400,
          maxWidth: "100%",
          mx: "auto",
          borderRadius: "sm",
          "& form": {
            display: "flex",
            flexDirection: "column",
            gap: 2
          },
          [`& .${formLabelClasses.asterisk}`]: {
            visibility: "hidden"
          }
        }}
      >
        <Stack gap={4} sx={{ mb: 2 }}>
          <Stack gap={1}>
            <Typography level="h3">Reset Password</Typography>
            <Typography level="body-sm">
              Enter your email address that you use with your account to
              continue.
            </Typography>
          </Stack>
        </Stack>
        <Stack gap={4} sx={{ mt: 2 }}>
          <form
            onSubmit={async (event: React.FormEvent<SignInFormElement>) => {
              event.preventDefault();
              setIsLoading(true);
              const formElements = event.currentTarget.elements;
              await sendPasswordResetEmail(auth, formElements.email.value);
              setIsLoading(false);
            }}
          >
            <FormControl required>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" value={email} />
            </FormControl>
            <Stack gap={4} sx={{ mt: 2 }}>
              <Button type="submit" fullWidth loading={isLoading}>
                Continue
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
      <Box component="footer" sx={{ py: 3 }}>
        <Typography level="body-xs" textAlign="center">
          © Ministry Mapper {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
