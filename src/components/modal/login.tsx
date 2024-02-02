import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { auth } from "../../firebase";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import { FirebaseError } from "firebase-admin";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from "firebase/auth";
import errorMessage from "../../utils/helpers/errormsg";

const Login = NiceModal.create(() => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [validated, setValidated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const modal = useModal();
  const rollbar = useRollbar();

  const loginInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    try {
      setIsLogin(true);
      await signInWithEmailAndPassword(auth, email, password);
      modal.hide();
    } catch (err) {
      setValidated(false);
      errorHandler(errorMessage((err as FirebaseError).code), rollbar);
    } finally {
      setIsLogin(false);
    }
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    setValidated(true);
    if (form.checkValidity() === false) {
      return;
    }
    loginInWithEmailAndPassword(loginEmail, loginPassword);
  };

  const handleForgotPassword = async () => {
    try {
      if (!loginEmail) {
        alert("Please enter an email address.");
        return;
      }
      await sendPasswordResetEmail(auth, loginEmail);
      rollbar.info(`User attempting to reset password! Email: ${loginEmail}`);
      alert(`Password reset email sent to ${loginEmail}.`);

      modal.hide();
    } catch (error) {
      errorHandler(errorMessage((error as FirebaseError).code), rollbar);
    }
  };
  return (
    <Modal {...bootstrapDialog(modal)}>
      <Form noValidate validated={validated} onSubmit={handleLoginSubmit}>
        <Modal.Header>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={loginEmail}
              required
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">
              Please enter a valid email.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={loginPassword}
              required
              onChange={(event) => setLoginPassword(event.target.value)}
            />
            <Form.Control.Feedback type="invalid">
              Please enter password.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group
            className="mb-3 text-end"
            controlId="formBasicForgotPassword"
          >
            <a
              href="#"
              onClick={() => handleForgotPassword()}
              style={{ textDecoration: "none" }}
            >
              Forgot Password?
            </a>
          </Form.Group>
        </Modal.Body>
        <ModalFooter
          handleClick={modal.hide}
          isSaving={isLogin}
          submitLabel="Login"
        >
          <Button
            variant="primary"
            type="reset"
            onClick={() => {
              setLoginPassword("");
              setLoginEmail("");
              setValidated(false);
            }}
          >
            Clear
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
});

export default Login;
