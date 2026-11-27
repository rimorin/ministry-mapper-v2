import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const ld = vi.hoisted(() => ({
  client: { identify: vi.fn() } as
    { identify: ReturnType<typeof vi.fn> } | undefined,
  groups: vi.fn(),
  user: { id: "u1", name: "Sandy", email: "sandy@example.com" } as unknown
}));

vi.mock("launchdarkly-react-client-sdk", () => ({
  useLDClient: () => ld.client
}));
vi.mock("../utils/pocketbase", () => ({ getUser: () => ld.user }));
vi.mock("../utils/helpers/getcongregationmembers", () => ({
  getCongregationGroups: ld.groups
}));

const { default: useLaunchDarklyContext } =
  await import("./useLaunchDarklyContext");

const staff = [{ code: "c1", access: "conductor", name: "North" }];
const noGroups: string[] = [];
type Multi = Record<string, Record<string, unknown>>;
const identified = () => ld.client!.identify.mock.calls.at(-1)?.[0] as Multi;

describe("useLaunchDarklyContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ld.client = { identify: vi.fn() };
    ld.user = { id: "u1", name: "Sandy", email: "sandy@example.com" };
    ld.groups.mockResolvedValue([
      { id: "g2", name: "Group 2", members: ["u1"] },
      { id: "g3", name: "Group 3", members: ["u9"] }
    ]);
  });

  it("identifies staff with their groups in the open congregation", async () => {
    renderHook(() => useLaunchDarklyContext(staff, "c1", noGroups));

    await waitFor(() => expect(ld.client!.identify).toHaveBeenCalledTimes(1));
    expect(ld.groups).toHaveBeenCalledWith("c1", "ld-groups-c1");
    expect(identified().user.groups).toEqual(["Group 2"]);
    expect(identified().congregation.key).toBe("c1");
  });

  it("still identifies staff when their groups can't be read", async () => {
    ld.groups.mockRejectedValue(new Error("offline"));
    renderHook(() => useLaunchDarklyContext(staff, "c1", noGroups));

    await waitFor(() => expect(ld.client!.identify).toHaveBeenCalledTimes(1));
    expect(identified().user.groups).toEqual([]);
  });

  it("identifies a publisher-only account with the groups its links route gave", async () => {
    const publisher = [{ code: "c1", access: "publisher", name: "North" }];
    const groups = ["Group 3"];
    renderHook(() => useLaunchDarklyContext(publisher, "", groups));

    await waitFor(() => expect(ld.client!.identify).toHaveBeenCalledTimes(1));
    expect(ld.groups).not.toHaveBeenCalled();
    expect(identified().user.roles).toEqual(["publisher"]);
    expect(identified().user.groups).toEqual(["Group 3"]);
  });

  it("waits for the roles, and does nothing without LaunchDarkly", async () => {
    const client = ld.client!;
    renderHook(() => useLaunchDarklyContext([], "c1", noGroups));
    ld.client = undefined;
    renderHook(() => useLaunchDarklyContext(staff, "c1", noGroups));

    await Promise.resolve();
    expect(client.identify).not.toHaveBeenCalled();
    expect(ld.groups).not.toHaveBeenCalled();
  });
});
