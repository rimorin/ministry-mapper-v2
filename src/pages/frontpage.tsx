import { useContext, useEffect, useState, lazy, Suspense } from "react";
import { Button, Container, Navbar } from "react-bootstrap";
import { MINISTRY_MAPPER_WIKI_PAGE } from "../utils/constants";
import NavBarBranding from "../components/navigation/branding";
import { StateContext } from "../components/utils/context";
import { authListener, getUser } from "../utils/pocketbase";

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
  const [loginUser, setLoginUser] = useState<AuthModel>(getUser() as AuthModel);
  const { frontPageMode } = context;

  useEffect(() => {
    authListener((model: AuthModel) => {
      setLoginUser(model);
    });
  }, []);

  if (loginUser && !loginUser.verified) {
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
