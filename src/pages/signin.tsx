import { useContext, useRef, useState } from "react";
import { Form, Button, Spinner, FloatingLabel } from "react-bootstrap";
import { pb } from "../utils/pocketbase";
import { useRollbar } from "@rollbar/react";
import errorHandler from "../utils/helpers/errorhandler";
import { StateContext } from "../components/utils/context";
import { usePostHog } from "posthog-js/react";

const LoginComponent = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [validated, setValidated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");
  const rollbar = useRollbar();
  const formRef = useRef<HTMLInputElement>(null);
  const posthog = usePostHog();

  const { setFrontPageMode } = useContext(StateContext);

  const loginInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    try {
      setIsLogin(true);
      await pb.collection("users").authWithPassword(email, password);
      posthog?.capture("login", {
        email
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const mfaId = err.response?.mfaId;
      setValidated(false);
      if (!mfaId) {
        errorHandler(err, rollbar);
        return;
      }
      await handleOtpRequest();
      setMfaId(mfaId);
    } finally {
      setIsLogin(false);
    }
  };

  const handleOtpRequest = async () => {
    try {
      const result = await pb.collection("users").requestOTP(loginEmail);
      setOtpSessionId(result.otpId);
    } catch (err) {
      errorHandler(err, rollbar);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      setIsLogin(true);
      await pb
        .collection("users")
        .authWithOTP(otpSessionId, otpCode, { mfaId: mfaId });
    } catch (err) {
      errorHandler(err, rollbar);
    } finally {
      setIsLogin(false);
    }
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
    if (form.checkValidity() === false) {
      return;
    }
    loginInWithEmailAndPassword(loginEmail, loginPassword);
  };

  return (
    <>
      {!otpSessionId ? (
        <Form
          noValidate
          validated={validated}
          onSubmit={handleLoginSubmit}
          className="responsive-width"
        >
          <Form.Group className="mb-3 text-center">
            <h1>Sign in</h1>
          </Form.Group>
          <Form.Group className="my-3" controlId="formBasicEmail">
            <FloatingLabel controlId="formBasicEmail" label="Email address">
              <Form.Control
                ref={formRef}
                type="email"
                placeholder="Enter email"
                value={loginEmail}
                required
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                }}
              />
              <Form.Control.Feedback type="invalid">
                Please enter a valid email.
              </Form.Control.Feedback>
            </FloatingLabel>
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
            <Form.Control.Feedback>Looks Good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">
              Please enter password.
            </Form.Control.Feedback>
            <div className="text-end">
              <Form.Text
                onClick={() => setFrontPageMode("forgot")}
                className="text-underline"
                muted
              >
                Forgot Password?
              </Form.Text>
            </div>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <Button variant="outline-primary" className="m-2" type="submit">
              {isLogin && (
                <>
                  <Spinner size="sm" />{" "}
                </>
              )}
              Sign In
            </Button>
            <Button
              className="mx-2"
              variant="outline-primary"
              type="reset"
              onClick={() => {
                setLoginPassword("");
                setLoginEmail("");
                setOtpCode("");
                setValidated(false);
              }}
            >
              Clear
            </Button>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <hr />
            <p>
              Dont have an account?{" "}
              <span
                style={{ cursor: "pointer", color: "blue" }}
                onClick={() => setFrontPageMode("signup")}
              >
                Sign Up
              </span>
            </p>
          </Form.Group>
        </Form>
      ) : (
        <Form
          noValidate
          onSubmit={handleOtpSubmit}
          className="responsive-width"
        >
          <Form.Group className="mb-3 text-center">
            <h1>One Time Password Verification</h1>
            <p className="text-muted">
              An OTP has been sent to your email address.
            </p>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicOtp">
            <FloatingLabel
              controlId="formBasicPassword"
              label="One-time Password"
            >
              <Form.Control
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
              />
            </FloatingLabel>
            <div className="text-end">
              <Form.Text
                onClick={() => {
                  handleOtpRequest();
                  alert("OTP sent to your email");
                }}
                className="text-underline"
                muted
              >
                Resent OTP
              </Form.Text>
            </div>
          </Form.Group>
          <Form.Group className="text-center" controlId="formBasicButton">
            <Button variant="outline-primary" className="m-2" type="submit">
              Verify
            </Button>
            <Button
              className="mx-2"
              variant="outline-primary"
              type="reset"
              onClick={() => setOtpCode("")}
            >
              Clear
            </Button>
            {navigator.clipboard && (
              <Button
                className="mx-2"
                variant="outline-primary"
                type="button"
                onClick={async () => {
                  setOtpCode(await navigator.clipboard.readText());
                }}
              >
                Paste
              </Button>
            )}
          </Form.Group>
        </Form>
      )}
    </>
  );
};

export default LoginComponent;
