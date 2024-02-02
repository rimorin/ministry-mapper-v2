import { useEffect, useState } from "react";
import { User, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useRollbar } from "@rollbar/react";
import VerificationPage from "../components/navigation/verification";
import Admin from "./dashboard/admin";
import LoginPage from "./login";

const FrontPage = () => {
  const rollbar = useRollbar();
  const [loginUser, setLoginUser] = useState<User>();
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
            alert(
              "Resent verification email! Please check your inbox or spam folder."
            )
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
