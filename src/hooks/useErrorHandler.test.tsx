import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "react-error-boundary";
import useErrorHandler from "./useErrorHandler";

describe("useErrorHandler", () => {
  it("returns handleError function", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapper = ({ children }: any) => (
      <ErrorBoundary FallbackComponent={() => <div>Error</div>}>
        {children}
      </ErrorBoundary>
    );

    const { result } = renderHook(() => useErrorHandler(), { wrapper });

    expect(result.current.handleError).toBeDefined();
    expect(typeof result.current.handleError).toBe("function");
  });

  it("converts non-Error objects to Error", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapper = ({ children }: any) => (
      <ErrorBoundary FallbackComponent={() => <div>Error</div>}>
        {children}
      </ErrorBoundary>
    );

    const { result } = renderHook(() => useErrorHandler(), { wrapper });

    expect(() => {
      result.current.handleError("String error", { silent: true });
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it("handles Error objects", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapper = ({ children }: any) => (
      <ErrorBoundary FallbackComponent={() => <div>Error</div>}>
        {children}
      </ErrorBoundary>
    );

    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    const testError = new Error("Test error");

    expect(() => {
      result.current.handleError(testError, { silent: true });
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });
});
