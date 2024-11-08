import { useContext, useState, useCallback } from "react";
import { Form, Button, Spinner, FloatingLabel } from "react-bootstrap";
import PasswordChecklist from "react-password-checklist";
import { useRollbar } from "@rollbar/react";
import errorHandler from "../utils/helpers/errorhandler";
import { PASSWORD_POLICY, MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { StateContext } from "../components/utils/context";
import { pb } from "../utils/pocketbase";
const { VITE_PRIVACY_URL, VITE_TERMS_URL } = import.meta.env;

const SignupComponent = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [validated, setValidated] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const rollbar = useRollbar();
  const { setFrontPageMode } = useContext(StateContext);
  const privacyUrl = VITE_PRIVACY_URL;
  const termsUrl = VITE_TERMS_URL;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData((prevData) => ({ ...prevData, [id]: value }));
    },
    []
  );

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    setValidated(true);
    if (form.checkValidity() === false) {
      return;
    }
    setIsCreating(true);
    try {
      await pb.collection("users").create(
        {
          email: formData.email,
          name: formData.name,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          emailVisibility: true
        },
        {
          requestKey: `user-signup-${formData.email}`
        }
      );
      await pb.collection("users").requestVerification(formData.email, {
        requestKey: `verify-email-${formData.email}`
      });
      rollbar.info(
        `New User Created! Email: ${formData.email}, Name: ${formData.name}`
      );
      alert(
        "Account created! Please check your email for verification procedures."
      );
      setFrontPageMode("login");
    } catch (err) {
      setValidated(false);
      errorHandler(err, rollbar);
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreationForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: ""
    });
    setValidated(false);
  };

  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={handleCreateSubmit}
      className="responsive-width"
    >
      <Form.Group className="mb-3 text-center">
        <h1>Sign Up</h1>
      </Form.Group>
      <Form.Group className="mb-3" controlId="name">
        <FloatingLabel controlId="name" label="User Name">
          <Form.Control
            type="text"
            placeholder="Enter Name"
            value={formData.name}
            required
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3" controlId="email">
        <FloatingLabel controlId="email" label="Email Address">
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={formData.email}
            required
            onChange={handleInputChange}
          />
          <Form.Control.Feedback type="invalid">
            Please enter a valid email.
          </Form.Control.Feedback>
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3" controlId="password">
        <FloatingLabel controlId="password" label="Password">
          <Form.Control
            type="password"
            placeholder="Password"
            value={formData.password}
            required
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3" controlId="confirmPassword">
        <FloatingLabel controlId="confirmPassword" label="Confirm Password">
          <Form.Control
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            required
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3">
        <PasswordChecklist
          rules={PASSWORD_POLICY}
          minLength={MINIMUM_PASSWORD_LENGTH}
          value={formData.password}
          valueAgain={formData.confirmPassword}
          onChange={setIsPasswordValid}
        />
      </Form.Group>
      <Form.Group className="text-center mb-3">
        <p>
          By signing up, you agree to our{" "}
          <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>{" "}
          and our{" "}
          <a href={termsUrl} target="_blank" rel="noopener noreferrer">
            terms of service
          </a>
          .
        </p>
      </Form.Group>
      <Form.Group className="text-center" controlId="formBasicButton">
        <Button
          variant="outline-primary"
          className={`m-2 ${!isPasswordValid && "disabled"}`}
          type="submit"
        >
          {isCreating && (
            <>
              <Spinner size="sm" />{" "}
            </>
          )}
          Sign Up
        </Button>
        <Button
          className="mx-2"
          variant="outline-primary"
          type="reset"
          onClick={resetCreationForm}
        >
          Clear
        </Button>
      </Form.Group>
      <Form.Group className="text-center" controlId="formBasicButton">
        <hr />
        <p>
          Already have an account?{" "}
          <span
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => setFrontPageMode("login")}
          >
            Sign In
          </span>
        </p>
      </Form.Group>
    </Form>
  );
};

export default SignupComponent;
