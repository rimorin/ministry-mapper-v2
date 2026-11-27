import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/utils/test";
import PublisherDashboard from "./index";
import { USER_GUIDE_URL } from "../../utils/constants";

const account = vi.hoisted(() => ({ email: null as string | null }));

vi.mock("../../utils/pocketbase", () => ({
  getUser: (field?: string) => (field === "email" ? account.email : null)
}));

const show = (congregations: string[]) =>
  render(
    <PublisherDashboard
      userName="Maria Santos"
      onLogout={vi.fn()}
      myLinks={{
        links: [],
        congregations,
        groups: [],
        isLoading: false,
        hasFailed: false,
        isStale: false,
        updatedAt: null,
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

  it("shows the account's email, notifications, theme and help in the menu", async () => {
    account.email = "maria@example.test";
    const user = userEvent.setup();
    show(["Alpha Congregation"]);

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(await screen.findByText("maria@example.test")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Profile & notifications/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Theme/ })).toHaveTextContent(
      "System"
    );
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await user.click(screen.getByRole("menuitem", { name: "Help" }));
    expect(open).toHaveBeenCalledWith(USER_GUIDE_URL, "_blank", "noopener");
    open.mockRestore();
    account.email = null;
  });
});
