import { useContext, useState, useCallback } from "react";
import { Form, Spinner, FloatingLabel } from "react-bootstrap";
import PasswordChecklist from "react-password-checklist";
import { useTranslation } from "react-i18next";

import errorHandler from "../utils/helpers/errorhandler";
import { PASSWORD_POLICY, MINIMUM_PASSWORD_LENGTH } from "../utils/constants";
import { StateContext } from "../components/utils/context";
import { createData, verifyEmail } from "../utils/pocketbase";
import GenericButton from "../components/navigation/button";
import { getDisabledStyle } from "../utils/helpers/disabledstyle";

const { VITE_PRIVACY_URL, VITE_TERMS_URL } = import.meta.env;

const SignupComponent = () => {
  const { t } = useTranslation();
  const { setFrontPageMode } = useContext(StateContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [validated, setValidated] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleNavigateToLogin = useCallback(() => {
    setFrontPageMode("login");
  }, [setFrontPageMode]);

  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={handleCreateSubmit}
      className="responsive-width py-2"
      style={{ maxHeight: "100%", overflow: "auto" }}
    >
      <Form.Group className="mb-2 text-center">
        <h1 className="h4 mb-1">{t("auth.signUp", "Sign Up")}</h1>
        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
          {t(
            "auth.createAccount",
            "Create your account to get started with Ministry Mapper"
          )}
        </p>
      </Form.Group>
      <Form.Group className="mb-2" controlId="name">
        <FloatingLabel controlId="name" label={t("auth.name", "User Name")}>
          <Form.Control
            type="text"
            placeholder={t("auth.enterName", "Enter Name")}
            value={formData.name}
            required
            autoFocus
            autoComplete="name"
            disabled={isCreating}
            onChange={handleInputChange}
          />
          <Form.Control.Feedback type="invalid">
            {t("auth.nameRequired", "Please enter your name.")}
          </Form.Control.Feedback>
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-2" controlId="email">
        <FloatingLabel
          controlId="email"
          label={t("auth.emailAddress", "Email Address")}
        >
          <Form.Control
            type="email"
            placeholder={t("auth.enterEmail", "Enter email")}
            value={formData.email}
            required
            autoComplete="email"
            disabled={isCreating}
            onChange={handleInputChange}
          />
          <Form.Control.Feedback type="invalid">
            {t("auth.validEmailRequired", "Please enter a valid email.")}
          </Form.Control.Feedback>
        </FloatingLabel>
        <div id="email-help" className="form-text small mt-1">
          {t("auth.emailHelp", "We'll send a verification link to this email.")}
        </div>
      </Form.Group>
      <Form.Group className="mb-2" controlId="password">
        <FloatingLabel
          controlId="password"
          label={t("auth.password", "Password")}
        >
          <Form.Control
            type="password"
            placeholder={t("auth.password", "Password")}
            value={formData.password}
            required
            autoComplete="new-password"
            disabled={isCreating}
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-2" controlId="confirmPassword">
        <FloatingLabel
          controlId="confirmPassword"
          label={t("auth.confirmPassword", "Confirm Password")}
        >
          <Form.Control
            type="password"
            placeholder={t("auth.confirmPassword", "Confirm Password")}
            value={formData.confirmPassword}
            required
            autoComplete="new-password"
            disabled={isCreating}
            onChange={handleInputChange}
          />
        </FloatingLabel>
      </Form.Group>
      <Form.Group className="mb-2">
        <div
          id="password-requirements"
          className="password-checklist-compact"
          style={{ fontSize: "0.8rem" }}
        >
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
        </div>
      </Form.Group>
      <Form.Group className="text-center mb-2">
        <p className="mb-0" style={{ fontSize: "0.75rem", lineHeight: "1.3" }}>
          {t("auth.termsAgreement", "By signing up, you agree to our")}{" "}
          <a
            href={VITE_PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link-primary text-decoration-none"
          >
            {t("auth.privacyPolicy", "privacy policy")}
          </a>{" "}
          {t("auth.andOur", "and our")}{" "}
          <a
            href={VITE_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link-primary text-decoration-none"
          >
            {t("auth.termsOfService", "terms of service")}
          </a>
          .
        </p>
      </Form.Group>
      <Form.Group className="text-center mb-2" controlId="formBasicButton">
        <div className="d-flex gap-2 mb-2">
          <GenericButton
            variant="primary"
            className="flex-fill"
            type="submit"
            disabled={!isPasswordValid || isCreating}
            label={
              <>
                {isCreating && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    aria-hidden="true"
                  />
                )}{" "}
                {t("auth.signUp", "Sign Up")}
              </>
            }
          />
          <GenericButton
            variant="outline-secondary"
            className="flex-fill"
            type="reset"
            disabled={isCreating}
            label={t("common.clear", "Clear")}
            onClick={resetCreationForm}
          />
        </div>
        <p className="mb-0" style={{ fontSize: "0.85rem" }}>
          {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
          <a
            href="#"
            className="link-primary text-decoration-none fw-semibold"
            onClick={(e) => {
              e.preventDefault();
              if (!isCreating) handleNavigateToLogin();
            }}
            style={getDisabledStyle(isCreating)}
          >
            {t("auth.signIn", "Sign In")}
          </a>
        </p>
      </Form.Group>
    </Form>
  );
};

export default SignupComponent;
