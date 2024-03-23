import { useState, useEffect, lazy } from "react";
import { auth } from "../../firebase";
import Loader from "../../components/statics/loader";
import { sendEmailVerification, signOut, User } from "firebase/auth";
import { useRollbar } from "@rollbar/react";
const Admin = lazy(() => import("./admin"));
const VerificationPage = lazy(
  () => import("../../components/navigation/verification")
);

function Dashboard() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginUser, setLoginUser] = useState<User>();
  const rollbar = useRollbar();
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setLoginUser(user || undefined);
      setIsLoading(false);
    });
  }, []);
  if (isLoading) return <Loader />;
  if (loginUser && loginUser.emailVerified) {
    rollbar.info(
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
  return <Admin user={loginUser as User} />;
}

export default Dashboard;
