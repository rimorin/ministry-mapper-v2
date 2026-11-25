import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render as renderTranslated } from "@/utils/test";
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

  it.each([
    [2 * 24 * 60 * 60_000 + 3 * 60 * 60_000 + 30_000, "2d 3h"],
    [2 * 60 * 60_000 + 25 * 60_000 + 40_000, "2h 25m"],
    [42 * 60_000 + 17_000, "42m"],
    [14 * 60_000 + 5_000, "14m"],
    [45_000, "0:45"]
  ])("shows seconds only in the final minute (%i ms left)", (left, shown) => {
    const { container } = render(<ExpiryBadge endtime={Date.now() + left} />);

    expect(container.textContent).toMatch(new RegExp(`${shown}$`));
  });

  it("counts the final minute down by the second", () => {
    const { container } = render(<ExpiryBadge endtime={Date.now() + 61_500} />);
    expect(container.textContent).toMatch(/1m$/);

    act(() => vi.advanceTimersByTime(5_000));
    expect(container.textContent).toMatch(/0:56$/);

    act(() => vi.advanceTimersByTime(1_000));
    expect(container.textContent).toMatch(/0:55$/);
  });

  it("reads as plain text where it is framed already", () => {
    const { container } = renderTranslated(
      <ExpiryBadge plain endtime={Date.now() + 2 * 60 * 60_000 + 9 * 60_000} />
    );

    expect(container.textContent).toBe("Expires in 2h 9m");
    expect(container.querySelector("[data-slot=badge]")).toBeNull();
  });
});
