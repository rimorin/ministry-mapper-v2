import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "../../utils/test";
import UnauthorizedPage from "./unauth";

const account = vi.hoisted(() => ({
  id: "user1" as string | null,
  name: "Mei Ling" as string | null,
  email: "meiling@example.test" as string | null
}));

const listeners = vi.hoisted(() => ({
  onRole: null as null | (() => void),
  onFocus: null as null | (() => void),
  getList: vi.fn()
}));

vi.mock("../../utils/pocketbase", () => ({
  getUser: (field?: "id" | "name" | "email") =>
    field ? account[field] : account,
  getList: listeners.getList,
  isAbortError: (error: { name?: string }) => error?.name === "AbortError"
}));

vi.mock("../../hooks/useRealtime", () => ({
  default: (_collection: string, callback: () => void) => {
    listeners.onRole = callback;
  }
}));

vi.mock("../../hooks/useOnTabFocus", () => ({
  default: (callback: () => void) => {
    listeners.onFocus = callback;
  }
}));

vi.mock("../navigation/authlayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}));

describe("UnauthorizedPage", () => {
  const mockHandleClick = vi.fn();
  const reload = vi.fn();
  const realLocation = window.location;

  beforeEach(() => {
    mockHandleClick.mockClear();
    reload.mockClear();
    listeners.getList.mockReset();
    account.id = "user1";
    account.name = "Mei Ling";
    account.email = "meiling@example.test";
    // jsdom's location cannot reload; swap in a stub that records it.
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true
    });
    Reflect.deleteProperty(navigator, "share");
  });

  it("moves on by itself when the account is given a role", () => {
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    listeners.onRole?.();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("checks again when the person comes back to the app", async () => {
    listeners.getList.mockResolvedValue([{ id: "role1" }]);
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    listeners.onFocus?.();

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(listeners.getList).toHaveBeenCalledWith(
      "roles",
      expect.objectContaining({ filter: 'user="user1"' })
    );
  });

  it("stays put when coming back before being added", async () => {
    listeners.getList.mockResolvedValue([]);
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    listeners.onFocus?.();

    await waitFor(() => expect(listeners.getList).toHaveBeenCalled());
    expect(reload).not.toHaveBeenCalled();
  });

  it("sends the email to the administrator through the phone's share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true
    });
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Send my email to my administrator" })
    );

    expect(share).toHaveBeenCalledWith({
      text: "Please add me to Ministry Mapper. My email is meiling@example.test"
    });
  });

  it("copies the email where there is no share sheet", async () => {
    const user = userEvent.setup();
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    await user.click(screen.getByRole("button", { name: "Copy my email" }));

    expect(await navigator.clipboard.readText()).toBe("meiling@example.test");
  });

  it("says the account is signed in, not that access was denied", () => {
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    expect(
      screen.getByRole("heading", { name: /You're signed in/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/isn't part of a congregation yet/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/denied/i)).not.toBeInTheDocument();
  });

  it("shows the account to pass on to the administrator", () => {
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    expect(screen.getByText("Mei Ling")).toBeInTheDocument();
    expect(screen.getByText("meiling@example.test")).toBeInTheDocument();
    expect(
      screen.getByText(/Ask your congregation administrator to add you/i)
    ).toBeInTheDocument();
  });

  it("leaves the account box out when there is no email to show", () => {
    account.email = null;
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    expect(screen.queryByText(/Signed in as/i)).not.toBeInTheDocument();
  });

  it("offers to check again", () => {
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    expect(
      screen.getByRole("button", { name: /Check again/i })
    ).toBeInTheDocument();
  });

  it("lets the person switch to another account", async () => {
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Use another account/i })
    );
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it("keeps a way to reach us for a new congregation", () => {
    render(<UnauthorizedPage handleClick={mockHandleClick} />);

    expect(
      screen.getByText(/Setting up a new congregation/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact us/i })).toHaveAttribute(
      "href",
      "mailto:rimorin@gmail.com"
    );
  });
});
