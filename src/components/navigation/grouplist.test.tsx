import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, userEvent } from "../../utils/test";
import GroupList from "./grouplist";

const pb = vi.hoisted(() => ({
  members: vi.fn(),
  groups: vi.fn(),
  showModal: vi.fn()
}));

vi.mock(
  "../../utils/helpers/getcongregationmembers",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../utils/helpers/getcongregationmembers")
    >()),
    default: pb.members,
    getCongregationGroups: pb.groups
  })
);

vi.mock("../../hooks/useModalManagement", () => ({
  useModalManagement: () => ({ showModal: pb.showModal })
}));

const person = (id: string, name: string) => ({
  id,
  name,
  email: `${id}@alpha.test`,
  role: "publisher",
  maps: [],
  groups: []
});

const roster = [
  person("sam", "Sam Lee"),
  person("rita", "Rita Tan"),
  person("joe", "Joe Ng")
];

const group3 = { id: "g1", name: "Group 3", members: ["sam", "rita", "gone"] };

describe("GroupList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.members.mockResolvedValue(roster);
    pb.groups.mockResolvedValue([group3]);
  });

  it("lists each group with who is in it, and who is in none", async () => {
    render(<GroupList congregation="cong1" />);

    expect(await screen.findByText("Group 3")).toBeInTheDocument();
    expect(screen.getByText("3 people")).toBeInTheDocument();
    expect(screen.getByText("Sam Lee, Rita Tan")).toBeInTheDocument();
    expect(screen.getByText("1 person isn't in a group")).toBeInTheDocument();
  });

  it("opens a group, and reads the groups again once it changed", async () => {
    const user = userEvent.setup();
    pb.showModal.mockResolvedValue(true);
    render(<GroupList congregation="cong1" />);

    await user.click(await screen.findByText("Group 3"));

    expect(pb.showModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ group: group3, taken: [] })
    );
    await waitFor(() => expect(pb.groups).toHaveBeenCalledTimes(2));
  });

  it("starts a new group with the others' names taken", async () => {
    const user = userEvent.setup();
    render(<GroupList congregation="cong1" />);
    await screen.findByText("Group 3");

    await user.click(screen.getByRole("button", { name: "New group" }));

    expect(pb.showModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        group: { id: "", name: "", members: [] },
        taken: ["Group 3"]
      })
    );
  });

  it("says when there are no groups yet", async () => {
    pb.groups.mockResolvedValue([]);
    render(<GroupList congregation="cong1" />);

    expect(await screen.findByText("No groups yet")).toBeInTheDocument();
  });
});
