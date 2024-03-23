import * as React from "react";
// import Box from "@mui/joy/Box";
// import Button from "@mui/joy/Button";
// import Divider from "@mui/joy/Divider";
// import FormControl from "@mui/joy/FormControl";
// import FormLabel, { formLabelClasses } from "@mui/joy/FormLabel";
// import IconButton from "@mui/joy/IconButton";
// import Link from "@mui/joy/Link";
// import Input from "@mui/joy/Input";
// import Typography from "@mui/joy/Typography";
// import Stack from "@mui/joy/Stack";
import ColorSchemeToggle from "../components/ColorSchemeToggle";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { AlertContext } from "../components/utils/context";
import { AlertSnackbarProps } from "../utils/interface";
import errorMessage from "../utils/helpers/errormsg";
import { FirebaseError } from "firebase/app";
import { useRollbar } from "@rollbar/react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Link,
  Stack,
  Typography,
  formLabelClasses
} from "@mui/material";

interface FormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
  password: HTMLInputElement;
}
interface SignInFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

export default function SignIn() {
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const { setSnackbarAlert } = React.useContext(
    AlertContext
  ) as AlertSnackbarProps;
  const rollbar = useRollbar();
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
          <IconButton disabled>
            <img src="favicon-32x32.png" alt="Ministry Mapper Icon" />
          </IconButton>
          <Typography variant="h6">Ministry Mapper</Typography>
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
            <Typography variant="body1">Sign in</Typography>
            <Typography variant="body1">
              New to the system?{" "}
              <Link href="signin" variant="body1">
                Sign up!
              </Link>
            </Typography>
          </Stack>
        </Stack>
        <Divider
        // sx={(theme) => ({
        //   [theme.getColorSchemeSelector("light")]: {
        //     color: { xs: "#FFF", md: "text.tertiary" },
        //     "--Divider-lineColor": {
        //       xs: "#FFF",
        //       md: "var(--joy-palette-divider)"
        //     }
        //   }
        // })}
        >
          or
        </Divider>
        <Stack gap={4} sx={{ mt: 2 }}>
          <form
            onSubmit={async (event: React.FormEvent<SignInFormElement>) => {
              event.preventDefault();
              setIsSigningIn(true);
              try {
                const formElements = event.currentTarget.elements;
                await signInWithEmailAndPassword(
                  auth,
                  formElements.email.value,
                  formElements.password.value
                );
              } catch (err) {
                const errorMsg = errorMessage((err as FirebaseError).code);
                setSnackbarAlert({
                  open: true,
                  message: errorMsg,
                  color: "danger"
                });
                rollbar.error(errorMsg);
              } finally {
                setIsSigningIn(false);
              }
            }}
          >
            <FormControl required>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" />
            </FormControl>
            <FormControl required>
              <FormLabel>Password</FormLabel>
              <Input type="password" name="password" />
            </FormControl>
            <Stack gap={4} sx={{ mt: 2 }}>
              <Box
                sx={{
                  textAlign: "right"
                }}
              >
                <Link href="reset">Forgot your password?</Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                endIcon={isSigningIn ? <CircularProgress /> : null}
              >
                Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
      <Box component="footer" sx={{ py: 3 }}>
        <Typography textAlign="center">
          © Ministry Mapper {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
