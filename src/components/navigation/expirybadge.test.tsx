import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ExpiryBadge from "./expirybadge";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

describe("ExpiryBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onExpired when the countdown reaches zero", () => {
    const onExpired = vi.fn();
    const endtime = Date.now() + 5_000;

    render(<ExpiryBadge endtime={endtime} onExpired={onExpired} />);

    act(() => vi.advanceTimersByTime(6_000));

    expect(onExpired).toHaveBeenCalledOnce();
  });

  it("calls onExpired exactly once, not on every subsequent tick", () => {
    const onExpired = vi.fn();
    const endtime = Date.now() + 2_000;

    render(<ExpiryBadge endtime={endtime} onExpired={onExpired} />);

    act(() => vi.advanceTimersByTime(10_000));

    expect(onExpired).toHaveBeenCalledOnce();
  });

  it("does not call onExpired when the timer is still running", () => {
    const onExpired = vi.fn();
    const endtime = Date.now() + FIFTEEN_MINUTES_MS + 60_000;

    render(<ExpiryBadge endtime={endtime} onExpired={onExpired} />);

    act(() => vi.advanceTimersByTime(30_000));

    expect(onExpired).not.toHaveBeenCalled();
  });

  it("does not call onExpired when prop is not provided", () => {
    const endtime = Date.now() + 2_000;

    expect(() => {
      render(<ExpiryBadge endtime={endtime} />);
      act(() => vi.advanceTimersByTime(4_000));
    }).not.toThrow();
  });
});
