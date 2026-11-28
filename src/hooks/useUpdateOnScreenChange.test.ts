import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { mockApplyWaitingUpdate } = vi.hoisted(() => ({
  mockApplyWaitingUpdate: vi.fn()
}));

vi.mock("@/utils/appUpdate", () => ({
  applyWaitingUpdate: mockApplyWaitingUpdate
}));

const { default: useUpdateOnScreenChange } =
  await import("./useUpdateOnScreenChange");

describe("useUpdateOnScreenChange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const render = (screen: string) =>
    renderHook(({ screen }) => useUpdateOnScreenChange(screen), {
      initialProps: { screen }
    });

  it("does nothing on the first render", () => {
    render("/");
    vi.runAllTimers();

    expect(mockApplyWaitingUpdate).not.toHaveBeenCalled();
  });

  it("applies a waiting update once each move has settled", () => {
    const { rerender } = render("/");

    rerender({ screen: "/map/abc" });
    expect(mockApplyWaitingUpdate).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(mockApplyWaitingUpdate).toHaveBeenCalledTimes(1);

    rerender({ screen: "/" });
    vi.runAllTimers();
    expect(mockApplyWaitingUpdate).toHaveBeenCalledTimes(2);
  });

  it("ignores renders that stay on the same screen", () => {
    const { rerender } = render("/");

    rerender({ screen: "/" });
    vi.runAllTimers();

    expect(mockApplyWaitingUpdate).not.toHaveBeenCalled();
  });

  it("drops the pending check when it unmounts", () => {
    const { rerender, unmount } = render("/");

    rerender({ screen: "/map/abc" });
    unmount();
    vi.runAllTimers();

    expect(mockApplyWaitingUpdate).not.toHaveBeenCalled();
  });
});
