import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EnvironmentIndicator from "./environment";

describe("EnvironmentIndicator", () => {
  it("does not render for production environment", () => {
    const { container } = render(
      <EnvironmentIndicator environment="production" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render for production-like environments", () => {
    const { container } = render(
      <EnvironmentIndicator environment="production-eu" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders something for development environment", () => {
    const { container } = render(
      <EnvironmentIndicator environment="development" />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders something for staging environment", () => {
    const { container } = render(
      <EnvironmentIndicator environment="staging" />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders something for testing environment", () => {
    const { container } = render(
      <EnvironmentIndicator environment="testing" />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
