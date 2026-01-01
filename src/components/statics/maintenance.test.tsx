import { describe, it, expect } from "vitest";
import { render } from "../../utils/test";
import MaintenanceMode from "./maintenance";

describe("MaintenanceMode", () => {
  it("should render the maintenance mode component", () => {
    const { container } = render(<MaintenanceMode />);

    const title = container.querySelector(".card-title");
    expect(title).toBeInTheDocument();
  });

  it("should display maintenance message", () => {
    const { container } = render(<MaintenanceMode />);

    const cardText = container.querySelector(".card-text");
    expect(cardText).toBeInTheDocument();
  });

  it("should render maintenance text with correct styling", () => {
    const { container } = render(<MaintenanceMode />);

    const cardText = container.querySelector(".card-text");
    expect(cardText).toBeInTheDocument();
    expect(cardText).toHaveClass("text-justify");
  });
});
