import {
  Navbar,
  Container,
  Button,
  Form,
  FloatingLabel,
  Spinner
} from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Loader from "../components/statics/loader";
import NavBarBranding from "../components/navigation/branding";
import { PASSWORD_POLICY, MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import PasswordChecklist from "react-password-checklist";
import { pb } from "../utils/pocketbase";

const MODE_RESET_PASSWORD = "resetPassword";
const MODE_VERIFY_EMAIL = "verifyEmail";

const UserManagementComponent = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [message, setMessage] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cloginPassword, setCloginPassword] = useState("");
  const [isLoginPasswordOk, setIsLoginPasswordOk] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";

  async function handleResetPassword(actionCode: string): Promise<void> {
    try {
      setIsResetting(true);
      await pb
        .collection("users")
        .confirmPasswordReset(actionCode, loginPassword, cloginPassword);
      setMessage("Your password has been successfully reset.");
    } catch (error) {
      setMessage(JSON.stringify(error));
    } finally {
      setIsResetting(false);
    }
  }

  async function handleVerifyEmail(actionCode: string): Promise<void> {
    try {
      setIsProcessing(true);
      await pb.collection("users").confirmVerification(actionCode, {
        requestKey: `verify-email-${actionCode}`
      });
      setMessage("Your email address has been verified.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    } finally {
      setIsProcessing(false);
    }
  }

  const resetCreationForm = () => {
    setLoginPassword("");
    setCloginPassword("");
    setValidated(false);
  };

  useEffect(() => {
    if (mode === MODE_VERIFY_EMAIL) {
      handleVerifyEmail(oobCode);
    }
  }, []);

  let managementComponent;
  switch (mode) {
    case MODE_RESET_PASSWORD:
      managementComponent = (
        <>
          <Form
            noValidate
            validated={validated}
            onSubmit={(event) => {
              event.preventDefault();
              handleResetPassword(oobCode);
            }}
            className="responsive-width"
          >
            <Form.Group className="mb-3 text-center">
              <h1>Reset Password</h1>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <FloatingLabel controlId="formBasicPassword" label="Password">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  required
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
              <FloatingLabel
                controlId="formBasicConfirmPassword"
                label="Confirm Password"
              >
                <Form.Control
                  type="password"
                  placeholder="Confirm Password"
                  value={cloginPassword}
                  onChange={(event) => setCloginPassword(event.target.value)}
                  required
                />
              </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3">
              <PasswordChecklist
                rules={PASSWORD_POLICY}
                minLength={MINIMUM_PASSWORD_LENGTH}
                value={loginPassword}
                valueAgain={cloginPassword}
                onChange={(isValid) => setIsLoginPasswordOk(isValid)}
              />
            </Form.Group>
            <Form.Group className="text-center" controlId="formBasicButton">
              <Button
                variant="primary"
                type="submit"
                disabled={!isLoginPasswordOk}
              >
                {isResetting && (
                  <>
                    <Spinner size="sm" />{" "}
                  </>
                )}
                Submit
              </Button>
              <Button
                className="mx-2"
                variant="outline-primary"
                type="reset"
                onClick={() => resetCreationForm()}
              >
                Clear
              </Button>
            </Form.Group>
          </Form>
        </>
      );
      break;
    default:
      managementComponent = <div>Invalid Request</div>;
  }

  if (message) {
    managementComponent = (
      <div
        className="d-flex flex-column justify-content-between"
        style={{ height: "100%" }}
      >
        <div className="fluid-bolding mb-3">{message}</div>
      </div>
    );
  }

  if (isProcessing) return <Loader />;
  return (
    <>
      <div className="d-flex flex-column" style={{ minHeight: "99vh" }}>
        <Navbar bg="light">
          <Container fluid>
            <NavBarBranding naming="" />
          </Container>
        </Navbar>
        <Container
          fluid
          className="d-flex align-items-center justify-content-center"
          style={{ flexGrow: 1 }}
        >
          {managementComponent}
        </Container>
      </div>
    </>
  );
};

export default UserManagementComponent;
