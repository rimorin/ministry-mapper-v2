import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BackToTopButton from "./backtotop";

vi.mock("../../utils/helpers/assetpath", () => ({
  getAssetUrl: vi.fn((path: string) => `/assets/${path}`)
}));

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
    const button = screen.getByRole("img", { name: /back to top/i });
    expect(button).toBeInTheDocument();
  });

  it("should not be visible when showButton is false", () => {
    const { container } = render(<BackToTopButton showButton={false} />);
    const fadeDiv = container.querySelector(".back-to-top");
    expect(fadeDiv).toHaveClass("fade");
    expect(fadeDiv).not.toHaveClass("show");
  });

  it("should scroll to top when clicked", async () => {
    const user = userEvent.setup();
    render(<BackToTopButton showButton={true} />);

    const buttonContainer = screen
      .getByRole("img", { name: /back to top/i })
      .closest("div");
    if (buttonContainer) {
      await user.click(buttonContainer);
    }

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth"
    });
  });

  it("should render with correct image source", () => {
    render(<BackToTopButton showButton={true} />);
    const image = screen.getByRole("img", { name: /back to top/i });
    expect(image).toHaveAttribute("src", "/assets/top-arrow.svg");
  });
});
