import { beforeEach, describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "../../utils/test";
import UnauthorizedPage from "./unauth";

const account = vi.hoisted(() => ({
  name: "Mei Ling" as string | null,
  email: "meiling@example.test" as string | null
}));

vi.mock("../../utils/pocketbase", () => ({
  getUser: (field?: "name" | "email") => (field ? account[field] : account)
}));

vi.mock("../navigation/authlayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}));

describe("UnauthorizedPage", () => {
  const mockHandleClick = vi.fn();

  beforeEach(() => {
    mockHandleClick.mockClear();
    account.name = "Mei Ling";
    account.email = "meiling@example.test";
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
