import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import BackToTopButton from "./backtotop";

describe("BackToTopButton", () => {
  const scrollToMock = vi.fn();

  beforeEach(() => {
    window.scrollTo = scrollToMock;
  });

  afterEach(() => {
    scrollToMock.mockClear();
  });

  it("should render when showButton is true", () => {
    render(<BackToTopButton showButton={true} />);

    expect(
      screen.getByRole("button", { name: /back to top/i })
    ).toBeInTheDocument();
  });

  it("should not be interactive when showButton is false", () => {
    render(<BackToTopButton showButton={false} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should scroll to top when clicked", async () => {
    const user = userEvent.setup();
    render(<BackToTopButton showButton={true} />);

    await user.click(screen.getByRole("button", { name: /back to top/i }));

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth"
    });
  });

  it("should render the arrow icon", () => {
    const { container } = render(<BackToTopButton showButton={true} />);

    const icon = container.querySelector("svg.lucide-arrow-up-to-line");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("h-5", "w-5");
  });

  it("should scroll to top with keyboard", async () => {
    const user = userEvent.setup();
    render(<BackToTopButton showButton={true} />);

    const button = screen.getByRole("button", { name: /back to top/i });
    button.focus();
    await user.keyboard("{Enter}");

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth"
    });
  });
});
