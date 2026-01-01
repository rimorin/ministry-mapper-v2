import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "./themetoggle";
import { ThemeContext } from "../utils/context";
import { useModalManagement } from "../../hooks/useModalManagement";
import type { ThemeMode } from "../../utils/interface";

vi.mock("../../hooks/useModalManagement");

describe("ThemeToggle", () => {
  const mockShowModal = vi.fn();

  beforeEach(() => {
    vi.mocked(useModalManagement).mockReturnValue({
      showModal: mockShowModal,
      hideModal: vi.fn()
    });
  });

  const renderWithTheme = (
    theme: ThemeMode,
    actualTheme: "light" | "dark" = "light"
  ) => {
    return render(
      <ThemeContext value={{ theme, actualTheme, setTheme: vi.fn() }}>
        <ThemeToggle />
      </ThemeContext>
    );
  };

  it("renders theme toggle button", () => {
    renderWithTheme("light");
    const button = screen.getByRole("button", { name: /theme settings/i });
    expect(button).toBeInTheDocument();
  });

  it("applies dark theme filter when theme is dark", () => {
    const { container } = renderWithTheme("dark", "dark");
    const image = container.querySelector("img");
    expect(image).toHaveStyle({ filter: "brightness(0) invert(1)" });
  });

  it("applies no filter when theme is light", () => {
    const { container } = renderWithTheme("light", "light");
    const image = container.querySelector("img");
    expect(image).toHaveStyle({ filter: "none" });
  });

  it("opens theme settings modal on click", async () => {
    const user = userEvent.setup();
    renderWithTheme("light");
    const button = screen.getByRole("button", { name: /theme settings/i });
    await user.click(button);
    expect(mockShowModal).toHaveBeenCalled();
  });

  it("applies custom className when provided", () => {
    render(
      <ThemeContext
        value={{ theme: "light", actualTheme: "light", setTheme: vi.fn() }}
      >
        <ThemeToggle className="custom-class" />
      </ThemeContext>
    );
    const button = screen.getByRole("button", { name: /theme settings/i });
    expect(button).toHaveClass("custom-class");
  });
});
