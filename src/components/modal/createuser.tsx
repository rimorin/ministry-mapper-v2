import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { auth } from "../../firebase";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import { FirebaseError } from "firebase-admin";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import errorMessage from "../../utils/helpers/errormsg";
import PasswordChecklist from "react-password-checklist";
import {
  PASSWORD_POLICY,
  MINIMUM_PASSWORD_LENGTH
} from "../../utils/constants";

const Login = NiceModal.create(() => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cloginPassword, setCloginPassword] = useState("");
  const [isLoginPasswordOk, setIsLoginPasswordOk] = useState(false);
  const [name, setName] = useState("");
  const [validated, setValidated] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const rollbar = useRollbar();
  const modal = useModal();

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
    if (form.checkValidity() === false) {
      return;
    }
    setIsCreating(true);
    try {
      const credentials = await createUserWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      await updateProfile(credentials.user, {
        displayName: name
      });
      rollbar.info(`New User Created! Email: ${loginEmail}, Name: ${name}`);
      sendEmailVerification(credentials.user);

      modal.hide();
      alert(
        "Account created! Please check your email for verification procedures."
      );
    } catch (err) {
      setValidated(false);
      console.log(err);
      errorHandler(errorMessage((err as FirebaseError).code), rollbar);
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreationForm = () => {
    setLoginPassword("");
    setLoginEmail("");
    setName("");
    setCloginPassword("");
    setValidated(false);
  };
  return (
    <Modal {...bootstrapDialog(modal)}>
      <Form noValidate validated={validated} onSubmit={handleCreateSubmit}>
        <Modal.Header>
          <Modal.Title>Create User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="formBasicName">
            <Form.Label>User Name</Form.Label>
            <Form.Control
              type="name"
              placeholder="Enter Name"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
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
              value={loginPassword}
              required
              onChange={(event) => setLoginPassword(event.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              value={cloginPassword}
              onChange={(event) => setCloginPassword(event.target.value)}
              required
            />
          </Form.Group>
          <PasswordChecklist
            rules={PASSWORD_POLICY}
            minLength={MINIMUM_PASSWORD_LENGTH}
            value={loginPassword}
            valueAgain={cloginPassword}
            onChange={(isValid) => setIsLoginPasswordOk(isValid)}
          />
        </Modal.Body>
        <ModalFooter
          handleClick={modal.hide}
          isSaving={isCreating}
          submitLabel="Create"
          disableSubmitBtn={!isLoginPasswordOk}
        >
          <Button
            variant="primary"
            type="reset"
            onClick={() => resetCreationForm()}
          >
            Clear
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
});

export default Login;
