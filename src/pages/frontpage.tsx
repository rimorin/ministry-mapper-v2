import { useContext, useEffect, useState } from "react";
import { User, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useRollbar } from "@rollbar/react";
import VerificationPage from "../components/navigation/verification";
import Admin from "./dashboard/admin";
import LoginPage from "./login";
import { AlertContext } from "../components/utils/context";
import { AlertSnackbarProps } from "../utils/interface";

const FrontPage = () => {
  const rollbar = useRollbar();
  const [loginUser, setLoginUser] = useState<User>();
  const { setSnackbarAlert } = useContext(AlertContext) as AlertSnackbarProps;
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setLoginUser(user || undefined);
    });
  }, []);

  if (!loginUser) {
    return <LoginPage />;
  }

  if (!loginUser?.emailVerified) {
    rollbar.warning(
      `Unverified user attempting to access the system! Email: ${loginUser.email}, Name: ${loginUser.displayName}`
    );
    return (
      <VerificationPage
        handleResendMail={() => {
          sendEmailVerification(loginUser).then(() =>
            setSnackbarAlert({
              message:
                "Resent verification email! Please check your inbox or spam folder.",
              color: "success",
              open: true
            })
          );
        }}
        handleClick={() => signOut(auth)}
        name={loginUser.displayName as string}
      />
    );
  }

  return <Admin user={loginUser} />;
};

export default FrontPage;
