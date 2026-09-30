import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { STATUS_CODES } from "../utils/constants";
import type { unitDetails } from "../utils/interface";
import useAddressFilter, {
  EMPTY_ADDRESS_FILTER,
  countAddressFilters,
  matchesAddressFilter
} from "./useAddressFilter";

const unit = (status: string, typeIds: string[]): unitDetails => ({
  id: "u1",
  number: "01",
  note: "",
  type: typeIds.map((id) => ({ id, code: id })),
  status,
  nhcount: "0",
  dnctime: 0,
  floor: 1,
  sequence: 1
});

describe("matchesAddressFilter", () => {
  const notHomeMalay = unit(STATUS_CODES.NOT_HOME, ["malay"]);

  it("matches everything when nothing is selected", () => {
    expect(matchesAddressFilter(notHomeMalay, EMPTY_ADDRESS_FILTER)).toBe(true);
  });

  it("treats the statuses in a group as alternatives", () => {
    const filter = {
      statuses: [STATUS_CODES.DEFAULT, STATUS_CODES.NOT_HOME],
      types: []
    };
    expect(matchesAddressFilter(notHomeMalay, filter)).toBe(true);
    expect(
      matchesAddressFilter(unit(STATUS_CODES.DONE, ["malay"]), filter)
    ).toBe(false);
  });

  it("matches a household type among several on the address", () => {
    const filter = { statuses: [], types: ["malay"] };
    expect(
      matchesAddressFilter(
        unit(STATUS_CODES.DONE, ["chinese", "malay"]),
        filter
      )
    ).toBe(true);
    expect(
      matchesAddressFilter(unit(STATUS_CODES.DONE, ["chinese"]), filter)
    ).toBe(false);
  });

  it("requires both groups to hold when both have selections", () => {
    const filter = { statuses: [STATUS_CODES.NOT_HOME], types: ["chinese"] };
    expect(matchesAddressFilter(notHomeMalay, filter)).toBe(false);
    expect(
      matchesAddressFilter(unit(STATUS_CODES.NOT_HOME, ["chinese"]), filter)
    ).toBe(true);
  });
});

describe("useAddressFilter", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  const filter = { statuses: [STATUS_CODES.NOT_HOME], types: ["malay"] };

  it("starts empty", () => {
    const { result } = renderHook(() => useAddressFilter("map1"));
    expect(countAddressFilters(result.current[0])).toBe(0);
  });

  it("restores the filter for the same scope within the tab session", () => {
    const first = renderHook(() => useAddressFilter("map1"));
    act(() => first.result.current[1](filter));
    first.unmount();

    const again = renderHook(() => useAddressFilter("map1"));
    expect(again.result.current[0]).toEqual(filter);

    const other = renderHook(() => useAddressFilter("map2"));
    expect(other.result.current[0]).toEqual(EMPTY_ADDRESS_FILTER);
  });

  it("forgets the stored filter once it is cleared", () => {
    const { result } = renderHook(() => useAddressFilter("map1"));
    act(() => result.current[1](filter));
    act(() => result.current[1](EMPTY_ADDRESS_FILTER));

    expect(window.sessionStorage.getItem("address-filter-map1")).toBeNull();
  });
});
