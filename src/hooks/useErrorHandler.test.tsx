import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary } from "react-error-boundary";
import useErrorHandler from "./useErrorHandler";

describe("useErrorHandler", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = ({ children }: any) => (
    <ErrorBoundary FallbackComponent={() => <div>Error</div>}>
      {children}
    </ErrorBoundary>
  );

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns handleError function", () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });

    expect(result.current.handleError).toBeDefined();
    expect(typeof result.current.handleError).toBe("function");
  });

  it("converts non-Error objects to Error", () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });

    expect(() => {
      result.current.handleError("String error", { silent: true });
    }).not.toThrow();
  });

  it("handles Error objects", () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    const testError = new Error("Test error");

    expect(() => {
      result.current.handleError(testError, { silent: true });
    }).not.toThrow();
  });
});
