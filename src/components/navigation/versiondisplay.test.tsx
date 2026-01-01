import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import VersionDisplay from "./versiondisplay";

describe("VersionDisplay", () => {
  it("should render version in production environment", () => {
    import.meta.env.VITE_SYSTEM_ENVIRONMENT = "production";
    import.meta.env.VITE_VERSION = "1.2.3";

    const { container } = render(<VersionDisplay />);
    const versionDiv = container.querySelector(".fixed-bottom");
    expect(versionDiv).toBeInTheDocument();
  });

  it("should not render in development environment", () => {
    import.meta.env.VITE_SYSTEM_ENVIRONMENT = "development";
    import.meta.env.VITE_VERSION = "1.2.3";

    const { container } = render(<VersionDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render in staging environment", () => {
    import.meta.env.VITE_SYSTEM_ENVIRONMENT = "staging";
    import.meta.env.VITE_VERSION = "1.2.3";

    const { container } = render(<VersionDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it("should have correct styling classes in production", () => {
    import.meta.env.VITE_SYSTEM_ENVIRONMENT = "production";
    import.meta.env.VITE_VERSION = "1.0.0";

    const { container } = render(<VersionDisplay />);
    const versionDiv = container.querySelector(".fixed-bottom");
    expect(versionDiv).toHaveClass("text-muted", "opacity-25", "m-2");
  });
});
