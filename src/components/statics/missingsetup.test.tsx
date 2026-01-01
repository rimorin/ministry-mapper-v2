import { describe, it, expect } from "vitest";
import { render } from "../../utils/test";
import MissingSetupPage from "./missingsetup";

describe("MissingSetupPage", () => {
  it("should render missing PocketBase URL message", () => {
    const { container } = render(
      <MissingSetupPage message="PocketBase URL is missing" />
    );

    const title = container.querySelector(".card-title");
    expect(title).toBeInTheDocument();
  });

  it("should render generic missing setup message", () => {
    const { container } = render(
      <MissingSetupPage message="Some configuration is missing" />
    );

    const title = container.querySelector(".card-title");
    expect(title).toBeInTheDocument();
  });

  it("should use correct translation key for PocketBase URL", () => {
    const { container } = render(
      <MissingSetupPage message="PocketBase URL not found" />
    );

    const title = container.querySelector(".card-title");
    expect(title?.textContent).toBe("errors.missingPocketBaseUrl");
  });

  it("should use correct translation key for other setup issues", () => {
    const { container } = render(
      <MissingSetupPage message="Database connection failed" />
    );

    const title = container.querySelector(".card-title");
    expect(title?.textContent).toBe("errors.missingSetup");
  });
});
