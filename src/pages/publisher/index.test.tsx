import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/utils/test";
import PublisherDashboard from "./index";

vi.mock("../../utils/pocketbase", () => ({ getUser: () => null }));

const show = (congregations: string[]) =>
  render(
    <PublisherDashboard
      userName="Maria Santos"
      onLogout={vi.fn()}
      myLinks={{
        links: [],
        congregations,
        isLoading: false,
        hasFailed: false,
        refresh: vi.fn()
      }}
    />
  );

describe("PublisherDashboard", () => {
  it("names the congregation under the title, with no maps in hand", () => {
    show(["Alpha Congregation"]);
    expect(screen.getByRole("heading", { name: "My Maps" })).toBeVisible();
    expect(screen.getByText("Alpha Congregation")).toBeInTheDocument();
    expect(screen.getByText("No maps right now")).toBeInTheDocument();
  });

  it("counts several congregations and lists them on request", async () => {
    const user = userEvent.setup();
    show(["Alpha Congregation", "Beta Congregation", "Gamma Congregation"]);

    expect(screen.queryByText("Beta Congregation")).toBeNull();
    await user.click(screen.getByRole("button", { name: "3 congregations" }));

    expect(await screen.findByText("Alpha Congregation")).toBeInTheDocument();
    expect(screen.getByText("Beta Congregation")).toBeInTheDocument();
    expect(screen.getByText("Gamma Congregation")).toBeInTheDocument();
  });

  it("leaves the title alone when none is known", () => {
    show([]);
    expect(screen.queryByText(/congregation/i)).toBeNull();
  });
});
