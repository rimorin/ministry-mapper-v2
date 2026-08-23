import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Policy } from "../utils/policies";
import { STATUS_CODES } from "../utils/constants";
import type { unitDetails } from "../utils/interface";
import useNextAvailable from "./useNextAvailable";

const HOUSEHOLD = { id: "t1", code: "C" };

const policy = new Policy("tester", [
  {
    id: "t1",
    code: "C",
    description: "Chinese",
    isCountable: true,
    isDefault: true,
    sequence: 1
  }
]);

const unit = (id: string, status = STATUS_CODES.DEFAULT): unitDetails => ({
  id,
  number: id,
  note: "",
  type: [HOUSEHOLD],
  status,
  nhcount: "0",
  dnctime: 0,
  floor: 1,
  sequence: 1
});

// A grid with three of five addresses still needing a call.
const units = [
  unit("a", STATUS_CODES.DONE),
  unit("b"),
  unit("c", STATUS_CODES.DONE),
  unit("d"),
  unit("e")
];

let scrollTo: Mock<(...args: unknown[]) => void>;

const attachContainer = (
  ref: React.RefObject<HTMLDivElement | null>,
  ids: string[]
) => {
  const container = document.createElement("div");
  container.getBoundingClientRect = () =>
    ({ top: 0, left: 0, width: 400, height: 300 }) as DOMRect;
  container.scrollTo = scrollTo;
  ids.forEach((id, index) => {
    const cell = document.createElement("div");
    cell.dataset.id = id;
    // Stacked 50px apart so each cell centres to a different offset.
    cell.getBoundingClientRect = () =>
      ({ top: index * 50, left: 0, width: 100, height: 50 }) as DOMRect;
    container.appendChild(cell);
  });
  ref.current = container;
};

beforeEach(() => {
  scrollTo = vi.fn<(...args: unknown[]) => void>();
});

describe("useNextAvailable", () => {
  it("counts only the addresses that still need a call", () => {
    const { result } = renderHook(() => useNextAvailable(units, policy));

    expect(result.current.remaining).toBe(3);
    expect(result.current.targetId).toBeUndefined();
  });

  it("walks the addresses in order and wraps back to the first", () => {
    const { result } = renderHook(() => useNextAvailable(units, policy));
    attachContainer(
      result.current.containerRef,
      units.map((u) => u.id)
    );

    const visited: (string | undefined)[] = [];
    for (let tap = 0; tap < 4; tap++) {
      act(() => result.current.goToNext());
      visited.push(result.current.targetId);
    }

    expect(visited).toEqual(["b", "d", "e", "b"]);
  });

  it("keeps its place when the address it jumped to is completed", () => {
    const done = units.map((u) =>
      u.id === "d" ? unit("d", STATUS_CODES.DONE) : u
    );
    const { result, rerender } = renderHook(
      ({ list }) => useNextAvailable(list, policy),
      { initialProps: { list: units } }
    );
    attachContainer(
      result.current.containerRef,
      units.map((u) => u.id)
    );

    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.targetId).toBe("d");

    // "d" gets marked done — the ring clears, but the next tap carries on to
    // "e" rather than starting over at "b".
    rerender({ list: done });
    expect(result.current.targetId).toBeUndefined();
    expect(result.current.remaining).toBe(2);

    act(() => result.current.goToNext());
    expect(result.current.targetId).toBe("e");
  });

  it("scrolls the container itself, centring the address in view", () => {
    const { result } = renderHook(() => useNextAvailable(units, policy));
    attachContainer(
      result.current.containerRef,
      units.map((u) => u.id)
    );

    act(() => result.current.goToNext());

    // "b" sits at y=50 and is 50 tall, in a 300-tall container.
    expect(scrollTo).toHaveBeenCalledWith({
      top: 50 - (300 - 50) / 2,
      left: 0 - (400 - 100) / 2,
      behavior: "smooth"
    });
  });

  it("does nothing when every address has been called on", () => {
    const allDone = units.map((u) => unit(u.id, STATUS_CODES.DONE));
    const { result } = renderHook(() => useNextAvailable(allDone, policy));
    attachContainer(
      result.current.containerRef,
      allDone.map((u) => u.id)
    );

    act(() => result.current.goToNext());

    expect(result.current.remaining).toBe(0);
    expect(result.current.targetId).toBeUndefined();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
