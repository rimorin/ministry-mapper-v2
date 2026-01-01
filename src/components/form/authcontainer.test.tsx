import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import AuthContainer from "./authcontainer";

describe("AuthContainer", () => {
  const defaultProps = {
    title: "Login",
    children: <div>Form content</div>
  };

  describe("rendering", () => {
    it("should render title", () => {
      render(<AuthContainer {...defaultProps} />);

      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Login"
      );
    });

    it("should render children", () => {
      render(<AuthContainer {...defaultProps} />);

      expect(screen.getByText("Form content")).toBeInTheDocument();
    });

    it("should render subtitle when provided", () => {
      render(
        <AuthContainer {...defaultProps} subtitle="Welcome back to the app" />
      );

      expect(screen.getByText("Welcome back to the app")).toBeInTheDocument();
    });

    it("should not render subtitle when not provided", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      const subtitle = container.querySelector(".text-muted");
      expect(subtitle).not.toBeInTheDocument();
    });
  });

  describe("icon", () => {
    it("should render icon when provided", () => {
      render(<AuthContainer {...defaultProps} icon="🔒" />);

      expect(screen.getByRole("img", { name: "Login" })).toBeInTheDocument();
      expect(screen.getByText("🔒")).toBeInTheDocument();
    });

    it("should not render icon when not provided", () => {
      render(<AuthContainer {...defaultProps} />);

      const icon = screen.queryByRole("img");
      expect(icon).not.toBeInTheDocument();
    });

    it("should use primary icon color by default", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} icon="🔒" />
      );

      const icon = container.querySelector(".icon-primary");
      expect(icon).toBeInTheDocument();
    });

    it("should use custom icon color", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} icon="🔒" iconColor="success" />
      );

      const icon = container.querySelector(".icon-success");
      expect(icon).toBeInTheDocument();
    });

    it("should render with danger icon color", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} icon="⚠️" iconColor="danger" />
      );

      const icon = container.querySelector(".icon-danger");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("form attributes", () => {
    it("should have noValidate by default", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      const form = container.querySelector("form");
      expect(form).toHaveAttribute("novalidate");
    });

    it("should allow validation when noValidate is false", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} noValidate={false} />
      );

      const form = container.querySelector("form");
      expect(form).not.toHaveAttribute("novalidate");
    });

    it("should not be validated by default", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      const form = container.querySelector("form");
      expect(form).not.toHaveClass("was-validated");
    });

    it("should apply validated class when validated is true", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} validated={true} />
      );

      const form = container.querySelector("form");
      expect(form).toHaveClass("was-validated");
    });
  });

  describe("form submission", () => {
    it("should call onSubmit when form is submitted", () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      const { container } = render(
        <AuthContainer {...defaultProps} onSubmit={handleSubmit} />
      );

      const form = container.querySelector("form");
      form?.dispatchEvent(new Event("submit", { bubbles: true }));

      expect(handleSubmit).toHaveBeenCalled();
    });

    it("should work without onSubmit handler", () => {
      expect(() => {
        render(<AuthContainer {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("styling", () => {
    it("should have responsive width class", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      const form = container.querySelector(".responsive-width");
      expect(form).toBeInTheDocument();
    });

    it("should have centered text for title section", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      const formGroup = container.querySelector(".text-center");
      expect(formGroup).toBeInTheDocument();
    });

    it("should have h3 styling on h1 title", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      const title = container.querySelector(".h3");
      expect(title).toBeInTheDocument();
    });
  });

  describe("comprehensive rendering", () => {
    it("should render all props together", () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <AuthContainer
          title="Register"
          subtitle="Create your account"
          icon="📝"
          iconColor="secondary"
          noValidate={false}
          validated={true}
          onSubmit={handleSubmit}
        >
          <input type="text" placeholder="Username" />
          <button type="submit">Submit</button>
        </AuthContainer>
      );

      expect(screen.getByText("Register")).toBeInTheDocument();
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.getByText("📝")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });
  });
});
