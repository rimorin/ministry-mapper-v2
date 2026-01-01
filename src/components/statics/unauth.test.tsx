import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import UnauthorizedPage from "./unauth";

describe("UnauthorizedPage", () => {
  const mockHandleClick = vi.fn();

  describe("rendering", () => {
    it("should render access denied title", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    it("should render unauthorized message", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      expect(
        screen.getByText(/You don't have permission to access this system/i)
      ).toBeInTheDocument();
    });

    it("should render ministry mapper logo", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      const logo = screen.getByAltText(/Ministry Mapper logo/i);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute(
        "src",
        expect.stringContaining("android-chrome")
      );
    });
  });

  describe("instructions", () => {
    it("should show existing user instructions", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      expect(
        screen.getByText(/Already part of a congregation/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Ask your administrator to grant you access/i)
      ).toBeInTheDocument();
    });

    it("should show new user instructions", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      expect(screen.getByText(/Need a new account/i)).toBeInTheDocument();
    });

    it("should display contact email link", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      const emailLink = screen.getByRole("link", { name: /contact us/i });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute("href", "mailto:rimorin@gmail.com");
    });
  });

  describe("alert section", () => {
    it("should render warning alert", () => {
      const { container } = render(
        <UnauthorizedPage handleClick={mockHandleClick} />
      );

      const alert = container.querySelector(".alert-warning");
      expect(alert).toBeInTheDocument();
    });

    it("should show what can you do heading", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      expect(screen.getByText(/What can you do/i)).toBeInTheDocument();
    });
  });

  describe("use another button", () => {
    it("should render use another account button", () => {
      render(<UnauthorizedPage handleClick={mockHandleClick} />);

      // The UseAnotherButton component should be rendered
      // We can check if it's in the document by looking for the button
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
