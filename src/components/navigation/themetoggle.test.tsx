import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "./themetoggle";
import { ThemeContext } from "../utils/context";
import { useModalManagement } from "../../hooks/useModalManagement";
import type { ThemeMode } from "../../utils/interface";

vi.mock("../../hooks/useModalManagement");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue
  })
}));

describe("ThemeToggle", () => {
  const mockShowModal = vi.fn();

  beforeEach(() => {
    mockShowModal.mockClear();
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

  it("renders the palette icon when theme is dark", () => {
    const { container } = renderWithTheme("dark", "dark");
    const icon = container.querySelector("svg.lucide-palette");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveStyle({ width: "1.25em", height: "1.25em" });
  });

  it("renders the palette icon when theme is light", () => {
    const { container } = renderWithTheme("light", "light");
    const icon = container.querySelector("svg.lucide-palette");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveStyle({ width: "1.25em", height: "1.25em" });
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
