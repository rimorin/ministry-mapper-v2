import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import NotFoundPage from "./notfound";

describe("NotFoundPage", () => {
  describe("rendering", () => {
    it("should render 404 page not found title", () => {
      render(<NotFoundPage />);

      expect(screen.getByText(/404 Page Not Found/i)).toBeInTheDocument();
    });

    it("should display error message", () => {
      render(<NotFoundPage />);

      expect(
        screen.getByText(
          /We are sorry, the page you requested could not be found/i
        )
      ).toBeInTheDocument();
    });

    it("should use StaticPageCard wrapper", () => {
      const { container } = render(<NotFoundPage />);

      const card = container.querySelector(".card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper text alignment", () => {
      const { container } = render(<NotFoundPage />);

      const cardText = container.querySelector(".text-justify");
      expect(cardText).toBeInTheDocument();
    });
  });
});
