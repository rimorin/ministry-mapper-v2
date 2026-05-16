import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import AuthContainer from "./authcontainer";

describe("AuthContainer", () => {
  const defaultProps = {
    title: "Login",
    children: <div>Form content</div>
  };

  describe("rendering", () => {
    it("should render title inside the card title slot", () => {
      render(<AuthContainer {...defaultProps} />);

      expect(screen.getByText("Login")).toHaveAttribute(
        "data-slot",
        "card-title"
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

      expect(
        container.querySelector('[data-slot="card-description"]')
      ).not.toBeInTheDocument();
    });
  });

  describe("icon", () => {
    it("should render icon when provided", () => {
      render(<AuthContainer {...defaultProps} icon="🔒" />);

      expect(screen.getByText("🔒")).toBeInTheDocument();
    });

    it("should not render icon when not provided", () => {
      render(<AuthContainer {...defaultProps} />);

      expect(screen.queryByText("🔒")).not.toBeInTheDocument();
    });

    it("should render the shared muted icon container by default", () => {
      render(<AuthContainer {...defaultProps} icon="🔒" />);

      expect(screen.getByText("🔒")).toHaveClass(
        "mx-auto",
        "mb-2",
        "flex",
        "size-12",
        "items-center",
        "justify-center",
        "rounded-full",
        "bg-muted",
        "text-2xl"
      );
    });

    it("should keep the same icon styling when iconColor is provided", () => {
      render(<AuthContainer {...defaultProps} icon="🔒" iconColor="success" />);

      expect(screen.getByText("🔒")).toHaveClass("bg-muted", "text-2xl");
    });

    it("should render custom icons inside the same wrapper", () => {
      render(<AuthContainer {...defaultProps} icon="⚠️" iconColor="danger" />);

      expect(screen.getByText("⚠️")).toHaveClass("rounded-full", "bg-muted");
    });
  });

  describe("form attributes", () => {
    it("should have noValidate by default", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      expect(container.querySelector("form")).toHaveAttribute("novalidate");
    });

    it("should allow validation when noValidate is false", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} noValidate={false} />
      );

      expect(container.querySelector("form")).not.toHaveAttribute("novalidate");
    });

    it("should not be validated by default", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      expect(container.querySelector("form")).toHaveAttribute(
        "data-validated",
        "false"
      );
    });

    it("should expose validated state through data-validated", () => {
      const { container } = render(
        <AuthContainer {...defaultProps} validated={true} />
      );

      expect(container.querySelector("form")).toHaveAttribute(
        "data-validated",
        "true"
      );
    });
  });

  describe("form submission", () => {
    it("should call onSubmit when form is submitted", () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      const { container } = render(
        <AuthContainer {...defaultProps} onSubmit={handleSubmit} />
      );

      container
        .querySelector("form")
        ?.dispatchEvent(new Event("submit", { bubbles: true }));

      expect(handleSubmit).toHaveBeenCalled();
    });

    it("should work without onSubmit handler", () => {
      expect(() => {
        render(<AuthContainer {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("styling", () => {
    it("should have responsive width classes on the card", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      expect(container.querySelector('[data-slot="card"]')).toHaveClass(
        "w-full",
        "shadow-md"
      );
    });

    it("should have centered text for title section", () => {
      const { container } = render(<AuthContainer {...defaultProps} />);

      expect(container.querySelector('[data-slot="card-header"]')).toHaveClass(
        "text-center",
        "pb-2"
      );
    });

    it("should use Tailwind typography classes for the title", () => {
      render(<AuthContainer {...defaultProps} />);

      expect(screen.getByText("Login")).toHaveClass(
        "text-2xl",
        "font-semibold",
        "tracking-tight"
      );
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
