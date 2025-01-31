import { useContext, useEffect, useState, lazy, Suspense } from "react";
import { Button, Container, Navbar } from "react-bootstrap";
import { MINISTRY_MAPPER_WIKI_PAGE } from "../utils/constants";
import NavBarBranding from "../components/navigation/branding";
import { StateContext } from "../components/utils/context";
import { pb } from "../utils/pocketbase";
import { useRollbar } from "@rollbar/react";
import VerificationPage from "../components/navigation/verification";
import { AuthModel } from "pocketbase";
import Loader from "../components/statics/loader";
const { VITE_ABOUT_URL } = import.meta.env;

const AboutURL = (VITE_ABOUT_URL || MINISTRY_MAPPER_WIKI_PAGE) as string;

const SignupComponent = lazy(() => import("./signup"));
const LoginComponent = lazy(() => import("./signin"));
const ForgotComponent = lazy(() => import("./forgot"));
const Admin = lazy(() => import("./admin"));

const FrontPage = () => {
  const context = useContext(StateContext);
  const [loginUser, setLoginUser] = useState<AuthModel>(
    pb.authStore.isValid ? pb.authStore.record : null
  );
  const { frontPageMode } = context;
  const rollbar = useRollbar();

  useEffect(() => {
    const unsub = pb.authStore.onChange((_: string, model: AuthModel) =>
      setLoginUser(model)
    );
    return () => {
      unsub();
    };
  }, []);

  if (loginUser && !loginUser.verified) {
    rollbar.info(
      `Unverified user attempting to access the system!! Email: ${loginUser.email}, Name: ${loginUser.displayName}`
    );
    return <VerificationPage user={loginUser} />;
  }

  if (loginUser) {
    return (
      <Suspense fallback={<Loader suspended />}>
        <Admin user={loginUser} />
      </Suspense>
    );
  }

  let componentToRender;
  switch (frontPageMode) {
    case "forgot":
      componentToRender = <ForgotComponent />;
      break;
    case "signup":
      componentToRender = <SignupComponent />;
      break;
    default:
      componentToRender = <LoginComponent />;
  }

  return (
    <>
      <div className="d-flex flex-column" style={{ minHeight: "99vh" }}>
        <Navbar bg="light">
          <Container fluid>
            <NavBarBranding naming="" />
            <div>
              <Button
                className="m-1"
                size="sm"
                variant="outline-primary"
                onClick={() => window.open(AboutURL)}
              >
                About
              </Button>
            </div>
          </Container>
        </Navbar>
        <Container
          fluid
          className="d-flex align-items-center justify-content-center"
          style={{ flexGrow: 1 }}
        >
          <Suspense fallback={<Loader suspended />}>
            {componentToRender}
          </Suspense>
        </Container>
      </div>
    </>
  );
};

export default FrontPage;
