import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const { callFunctionMock, notifyInfoMock, navigateMock, realtime } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
    callFunctionMock: vi.fn(),
    notifyInfoMock: vi.fn(),
    realtime: {} as {
      onEvent?: (data: { action: string; record: { id: string } }) => void;
      options?: { filter: string };
    }
  })
);

vi.mock("./useRealtime", () => ({
  default: (
    _collection: string,
    onEvent: typeof realtime.onEvent,
    options: typeof realtime.options
  ) => {
    realtime.onEvent = onEvent;
    realtime.options = options;
  }
}));

vi.mock("./useNotification", () => ({
  default: () => ({ notifyInfo: notifyInfoMock })
}));

vi.mock("wouter", () => ({ useLocation: () => ["/", navigateMock] }));

vi.mock("../utils/pocketbase", () => ({
  callFunction: callFunctionMock,
  getUser: () => "user1",
  isAbortError: (error: unknown) =>
    (error as { isAbort?: boolean })?.isAbort === true
}));

const { default: useMyLinks } = await import("./useMyLinks");

const link = { id: "link1", type: "normal", map_description: "Blk 100A" };

describe("useMyLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the account's links from the backend route", async () => {
    callFunctionMock.mockResolvedValueOnce({ assignments: [link] });

    const { result } = renderHook(() => useMyLinks());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(callFunctionMock).toHaveBeenCalledWith(
      "/assignments/mine",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.current.links).toEqual([link]);
    expect(result.current.hasFailed).toBe(false);
  });

  it("reports a failed load and recovers on refresh", async () => {
    callFunctionMock.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(result.current.hasFailed).toBe(true));
    expect(result.current.isLoading).toBe(false);

    callFunctionMock.mockResolvedValueOnce({ assignments: [link] });
    await act(() => result.current.refresh());

    expect(result.current.hasFailed).toBe(false);
    expect(result.current.links).toEqual([link]);
  });

  it("keeps waiting when a newer request replaced this one", async () => {
    callFunctionMock.mockRejectedValueOnce({ isAbort: true });

    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalled());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasFailed).toBe(false);
  });

  it("refetches when the tab comes back into view", async () => {
    callFunctionMock.mockResolvedValue({ assignments: [] });

    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
  });

  it("announces a link the moment it is given and lists it", async () => {
    callFunctionMock.mockResolvedValueOnce({ assignments: [] });
    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(realtime.options?.filter).toBe(
      'user="user1" || assignees ~ "user1"'
    );

    callFunctionMock.mockResolvedValueOnce({ assignments: [link] });
    act(() =>
      realtime.onEvent?.({ action: "create", record: { id: "link1" } })
    );

    await waitFor(() => expect(result.current.links).toEqual([link]));
    expect(notifyInfoMock).toHaveBeenCalledWith(
      "You were given a map",
      "Blk 100A",
      expect.objectContaining({ label: "Open" })
    );
    // The announcement opens the map it names.
    notifyInfoMock.mock.calls[0][2].onClick();
    expect(navigateMock).toHaveBeenCalledWith("/map/link1");
  });

  it("announces an existing link the account is added to, once", async () => {
    callFunctionMock.mockResolvedValueOnce({ assignments: [] });
    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    callFunctionMock.mockResolvedValue({ assignments: [link] });
    act(() =>
      realtime.onEvent?.({ action: "update", record: { id: "link1" } })
    );
    await waitFor(() => expect(notifyInfoMock).toHaveBeenCalledOnce());

    // A later change to the same link is not news.
    act(() =>
      realtime.onEvent?.({ action: "update", record: { id: "link1" } })
    );
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(3));
    expect(notifyInfoMock).toHaveBeenCalledOnce();
  });

  it("stays quiet about the links it starts with", async () => {
    callFunctionMock.mockResolvedValue({ assignments: [link] });
    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      realtime.onEvent?.({ action: "update", record: { id: "link1" } })
    );

    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    expect(notifyInfoMock).not.toHaveBeenCalled();
  });

  it("stays quiet about a link the account only created", async () => {
    callFunctionMock.mockResolvedValue({ assignments: [] });
    const { result } = renderHook(() => useMyLinks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => realtime.onEvent?.({ action: "create", record: { id: "own1" } }));

    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    expect(notifyInfoMock).not.toHaveBeenCalled();
  });
});
