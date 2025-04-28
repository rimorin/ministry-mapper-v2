import { useContext, useState, useCallback } from "react";
import { Form, Button, Spinner, FloatingLabel } from "react-bootstrap";
import PasswordChecklist from "react-password-checklist";
import { useTranslation } from "react-i18next";

import errorHandler from "../utils/helpers/errorhandler";
import { PASSWORD_POLICY, MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { StateContext } from "../components/utils/context";
import { createData, verifyEmail } from "../utils/pocketbase";
const { VITE_PRIVACY_URL, VITE_TERMS_URL } = import.meta.env;

const SignupComponent = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [validated, setValidated] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
      await createData(
        "users",
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
      await verifyEmail(formData.email);
      alert(
        t(
          "auth.accountCreated",
          "Account created! Please check your email for verification procedures."
        )
      );
      setFrontPageMode("login");
    } catch (err) {
      setValidated(false);
      errorHandler(err);
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreationForm = useCallback(() => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: ""
    });
    setValidated(false);
  }, []);

  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={handleCreateSubmit}
      className="responsive-width"
    >
      <Form.Group className="mb-3 text-center">
        <h1>{t("auth.signUp", "Sign Up")}</h1>
      </Form.Group>
      <Form.Group className="mb-3" controlId="name">
        <FloatingLabel controlId="name" label={t("auth.name", "User Name")}>
          <Form.Control
            type="text"
            placeholder={t("auth.enterName", "Enter Name")}
            value={formData.name}
            required
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3" controlId="email">
        <FloatingLabel
          controlId="email"
          label={t("auth.emailAddress", "Email Address")}
        >
          <Form.Control
            type="email"
            placeholder={t("auth.enterEmail", "Enter email")}
            value={formData.email}
            required
            onChange={handleInputChange}
          />
          <Form.Control.Feedback type="invalid">
            {t("auth.validEmailRequired", "Please enter a valid email.")}
          </Form.Control.Feedback>
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3" controlId="password">
        <FloatingLabel
          controlId="password"
          label={t("auth.password", "Password")}
        >
          <Form.Control
            type="password"
            placeholder={t("auth.password", "Password")}
            value={formData.password}
            required
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-3" controlId="confirmPassword">
        <FloatingLabel
          controlId="confirmPassword"
          label={t("auth.confirmPassword", "Confirm Password")}
        >
          <Form.Control
            type="password"
            placeholder={t("auth.confirmPassword", "Confirm Password")}
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
          messages={{
            minLength: t(
              "password.minLength",
              "Password must be at least {{length}} characters long.",
              { length: MINIMUM_PASSWORD_LENGTH }
            ),
            number: t("password.number", "Password must contain numbers."),
            capital: t(
              "password.capital",
              "Password must contain uppercase letters."
            ),
            match: t("password.match", "Passwords must match.")
          }}
        />
      </Form.Group>
      <Form.Group className="text-center mb-3">
        <p>
          {t("auth.termsAgreement", "By signing up, you agree to our")}{" "}
          <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
            {t("auth.privacyPolicy", "privacy policy")}
          </a>{" "}
          {t("auth.andOur", "and our")}{" "}
          <a href={termsUrl} target="_blank" rel="noopener noreferrer">
            {t("auth.termsOfService", "terms of service")}
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
          {t("auth.signUp", "Sign Up")}
        </Button>
        <Button
          className="mx-2"
          variant="outline-primary"
          type="reset"
          onClick={resetCreationForm}
        >
          {t("common.clear", "Clear")}
        </Button>
      </Form.Group>
      <Form.Group className="text-center" controlId="formBasicButton">
        <hr />
        <p>
          {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
          <span
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => setFrontPageMode("login")}
          >
            {t("auth.signIn", "Sign In")}
          </span>
        </p>
      </Form.Group>
    </Form>
  );
};

export default SignupComponent;
