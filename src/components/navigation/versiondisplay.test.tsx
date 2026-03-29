import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import VersionDisplay from "./versiondisplay";

describe("VersionDisplay", () => {
  it("should render version in production environment", () => {
    vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "production");
    vi.stubEnv("VITE_APP_VERSION", "1.2.3");

    const { container } = render(<VersionDisplay />);
    const versionDiv = container.querySelector(".fixed-bottom");
    expect(versionDiv).toBeInTheDocument();
  });

  it("should not render in development environment", () => {
    vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "development");
    vi.stubEnv("VITE_APP_VERSION", "1.2.3");

    const { container } = render(<VersionDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("should render version in staging environment", () => {
    vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "staging");
    vi.stubEnv("VITE_APP_VERSION", "1.2.3");

    const { container } = render(<VersionDisplay />);
    const versionDiv = container.querySelector(".fixed-bottom");
    expect(versionDiv).toBeInTheDocument();
  });

  it("should not render in local environment", () => {
    vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "local");
    vi.stubEnv("VITE_APP_VERSION", "1.2.3");

    const { container } = render(<VersionDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("should have correct styling classes in production", () => {
    vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "production");
    vi.stubEnv("VITE_APP_VERSION", "1.0.0");

    const { container } = render(<VersionDisplay />);
    const versionDiv = container.querySelector(".fixed-bottom");
    expect(versionDiv).toHaveClass("text-muted", "opacity-25", "m-2");
  });
});
