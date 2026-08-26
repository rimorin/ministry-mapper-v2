import { useEffect, useRef, useState, lazy } from "react";

import { authListener, getUser, refreshAuth } from "../utils/pocketbase";
import { AuthModel } from "pocketbase";
import AuthLayout from "../components/navigation/authlayout";
import VerificationPage from "../components/navigation/verification";
import SuspenseComponent from "../components/utils/suspense";
import { ReleaseNotifier } from "../components/statics/releasenotifier";
import { trackPageview } from "../utils/analytics";

// All three render at "/", so the URL alone cannot tell them apart.
const FRONT_PAGE_VIEWS = {
  login: { url: "/login", title: "Login" },
  verify: { url: "/verify", title: "Verification" },
  admin: { url: "/admin", title: "Admin" }
} as const;

const LoginComponent = lazy(() => import("./signin"));
const Admin = SuspenseComponent(lazy(() => import("./admin/index")));

const FrontPage = () => {
  const [loginUser, setLoginUser] = useState<AuthModel>(getUser() as AuthModel);
  const loginUserRef = useRef(loginUser);

  useEffect(() => {
    if (loginUserRef.current) refreshAuth().catch(() => {});
    return authListener((model: AuthModel) => setLoginUser(model));
  }, []);

  // Keyed on the view name rather than loginUser so a re-auth that resolves to
  // the same screen does not report a second pageview.
  const view = loginUser ? (loginUser.verified ? "admin" : "verify") : "login";
  useEffect(() => {
    trackPageview(FRONT_PAGE_VIEWS[view].url, FRONT_PAGE_VIEWS[view].title);
  }, [view]);

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
