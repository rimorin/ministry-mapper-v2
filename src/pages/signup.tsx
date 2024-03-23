import * as React from "react";
// import Box from "@mui/joy/Box";
// import Button from "@mui/joy/Button";
// import FormControl from "@mui/joy/FormControl";
// import FormLabel, { formLabelClasses } from "@mui/joy/FormLabel";
// import IconButton from "@mui/joy/IconButton";
// import Input from "@mui/joy/Input";
// import Typography from "@mui/joy/Typography";
// import Stack from "@mui/joy/Stack";
import ColorSchemeToggle from "../components/ColorSchemeToggle";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";
import PasswordChecklist from "react-password-checklist";
import { PASSWORD_POLICY, MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import errorMessage from "../utils/helpers/errormsg";
import { AlertContext } from "../components/utils/context";
import { AlertSnackbarProps } from "../utils/interface";
import { FirebaseError } from "firebase/app";
import { useRollbar } from "@rollbar/react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Typography,
  formLabelClasses
} from "@mui/material";

interface FormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
  password: HTMLInputElement;
  persistent: HTMLInputElement;
}
interface SignInFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

export default function JoySignInSideTemplate() {
  const [isLoginPasswordOk, setIsLoginPasswordOk] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
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
          <IconButton disabled size="small">
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
        <Stack gap={4}>
          <Stack gap={1}>
            <Typography variant="h6">Create Your Account</Typography>
            <Typography variant="body1">
              Please approach your respective congregation administrators for
              further instructions after you have created and verified your
              account.
            </Typography>
          </Stack>
        </Stack>
        <Stack gap={4} sx={{ mt: 2 }}>
          <form
            onSubmit={async (event: React.FormEvent<SignInFormElement>) => {
              event.preventDefault();
              try {
                const credentials = await createUserWithEmailAndPassword(
                  auth,
                  email,
                  password
                );
                await updateProfile(credentials.user, {
                  displayName: name
                });
                sendEmailVerification(credentials.user);
                setSnackbarAlert({
                  open: true,
                  message:
                    "Account created! Please check your email for verification procedures.",
                  color: "success"
                });
              } catch (err) {
                const errorMsg = errorMessage((err as FirebaseError).code);
                setSnackbarAlert({
                  open: true,
                  message: errorMsg,
                  color: "danger"
                });
                rollbar.error(errorMsg);
              }
            }}
          >
            <FormControl required>
              <FormLabel>Name</FormLabel>
              <Input
                type="text"
                name="name"
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            <FormControl required>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl required>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <FormControl required>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                name="confirmPassword"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormControl>
            <Stack gap={2} sx={{ alignItems: "center" }}>
              <PasswordChecklist
                rules={PASSWORD_POLICY}
                minLength={MINIMUM_PASSWORD_LENGTH}
                value={password}
                valueAgain={confirmPassword}
                onChange={(isValid) => setIsLoginPasswordOk(isValid)}
              />
            </Stack>
            <Stack gap={4} sx={{ mt: 2 }}>
              <Button type="submit" fullWidth disabled={!isLoginPasswordOk}>
                Submit
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
      <Box component="footer" sx={{ py: 3 }}>
        <Typography variant="body2" textAlign="center">
          © Ministry Mapper {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
