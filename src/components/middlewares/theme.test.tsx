import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { use } from "react";
import ThemeMiddleware from "./theme";
import { ThemeContext } from "../utils/context";
import { setViewport, restoreBrowserStubs } from "../../utils/test";

const Probe = () => {
  const { colorTheme, setColorTheme } = use(ThemeContext);
  return (
    <>
      <span data-testid="color-theme">{colorTheme}</span>
      <button type="button" onClick={() => setColorTheme("cosmic")}>
        set-cosmic
      </button>
      <button type="button" onClick={() => setColorTheme("default")}>
        set-default
      </button>
    </>
  );
};

const renderMiddleware = () =>
  render(
    <ThemeMiddleware>
      <Probe />
    </ThemeMiddleware>
  );

describe("ThemeMiddleware color theme", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.remove("dark");
    setViewport(false);
  });

  afterEach(() => {
    restoreBrowserStubs();
  });

  it("defaults to no data-theme attribute", () => {
    renderMiddleware();
    expect(screen.getByTestId("color-theme")).toHaveTextContent("default");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("applies a stored color theme on mount", () => {
    localStorage.setItem("mm-color-theme", JSON.stringify("mocha"));
    renderMiddleware();
    expect(screen.getByTestId("color-theme")).toHaveTextContent("mocha");
    expect(document.documentElement.dataset.theme).toBe("mocha");
  });

  it("falls back to default when the stored value is not a known theme", () => {
    localStorage.setItem("mm-color-theme", JSON.stringify("rose"));
    renderMiddleware();
    expect(screen.getByTestId("color-theme")).toHaveTextContent("default");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("sets the data-theme attribute and persists on change", async () => {
    const user = userEvent.setup();
    renderMiddleware();
    await user.click(screen.getByRole("button", { name: "set-cosmic" }));
    expect(document.documentElement.dataset.theme).toBe("cosmic");
    expect(localStorage.getItem("mm-color-theme")).toBe(
      JSON.stringify("cosmic")
    );
  });

  it("removes the data-theme attribute when switching back to default", async () => {
    const user = userEvent.setup();
    localStorage.setItem("mm-color-theme", JSON.stringify("cosmic"));
    renderMiddleware();
    expect(document.documentElement.dataset.theme).toBe("cosmic");
    await user.click(screen.getByRole("button", { name: "set-default" }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
