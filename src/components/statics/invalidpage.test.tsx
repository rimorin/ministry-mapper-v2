import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@/utils/test";
import InvalidPage from "./invalidpage";

const account = vi.hoisted(() => ({ id: "user1" as string | null }));

vi.mock("../../utils/pocketbase", () => ({
  getUser: () => account.id
}));

vi.mock("../navigation/authlayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}));

describe("InvalidPage", () => {
  beforeEach(() => {
    account.id = "user1";
  });

  it("says the time ran out", () => {
    render(<InvalidPage reason="expired" />);

    expect(
      screen.getByRole("heading", { name: "Time's up for this map" })
    ).toBeInTheDocument();
  });

  it("says the conductor took the map back, not that it expired", () => {
    render(<InvalidPage reason="taken-back" />);

    expect(
      screen.getByRole("heading", { name: "This map was taken back" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/expired/i)).not.toBeInTheDocument();
  });

  it("covers both when the server did not say which", () => {
    render(<InvalidPage />);

    expect(
      screen.getByRole("heading", { name: "This map is no longer available" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Its time ran out, or your conductor ended it.")
    ).toBeInTheDocument();
  });

  it("takes a signed-in account back to its maps", () => {
    render(<InvalidPage reason="expired" />);

    expect(
      screen.getByRole("link", { name: "Back to My Maps" })
    ).toHaveAttribute("href", "/");
  });

  it("tells someone on a shared link to ask for a new one", () => {
    account.id = null;
    render(<InvalidPage reason="expired" />);

    expect(
      screen.queryByRole("link", { name: "Back to My Maps" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Ask your conductor if you need a new link/)
    ).toBeInTheDocument();
  });
});
