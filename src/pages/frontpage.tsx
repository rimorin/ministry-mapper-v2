import { useEffect, useRef, useState, lazy } from "react";

import { authListener, getUser, refreshAuth } from "../utils/pocketbase";
import { AuthModel } from "pocketbase";
import AuthLayout from "../components/navigation/authlayout";
import VerificationPage from "../components/navigation/verification";
import SuspenseComponent from "../components/utils/suspense";
import { ReleaseNotifier } from "../components/statics/releasenotifier";

const LoginComponent = lazy(() => import("./signin"));
const Admin = SuspenseComponent(lazy(() => import("./admin/index")));

const FrontPage = () => {
  const [loginUser, setLoginUser] = useState<AuthModel>(getUser() as AuthModel);
  const loginUserRef = useRef(loginUser);

  useEffect(() => {
    if (loginUserRef.current) refreshAuth().catch(() => {});
    return authListener((model: AuthModel) => setLoginUser(model));
  }, []);

  if (loginUser && !loginUser.verified) {
    return <VerificationPage user={loginUser} />;
  }

  if (loginUser) {
    return (
      <>
        <ReleaseNotifier />
        <Admin user={loginUser} />
      </>
    );
  }

  return (
    <AuthLayout>
      <LoginComponent />
    </AuthLayout>
  );
};

export default FrontPage;
