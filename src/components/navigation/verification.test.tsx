import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../utils/test";
import userEvent from "@testing-library/user-event";
import VerificationPage from "./verification";
import {
  cleanupSession,
  refreshAuth,
  verifyEmail
} from "../../utils/pocketbase";

vi.mock("../../utils/pocketbase", () => ({
  cleanupSession: vi.fn(),
  refreshAuth: vi.fn(),
  verifyEmail: vi.fn()
}));

// The shared frame brings the app's footer with it, which needs providers
// this page has no part in.
vi.mock("./authlayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}));

const notify = vi.hoisted(() => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
  notifyWarning: vi.fn()
}));

vi.mock("../../hooks/useNotification", () => ({ default: () => notify }));

describe("VerificationPage", () => {
  const mockUser = {
    id: "test-user-id",
    collectionId: "test-collection-id",
    collectionName: "users",
    email: "test@example.com",
    name: "Test User",
    verified: false,
    created: "2024-01-01",
    updated: "2024-01-01"
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("says what to do and shows the address the link went to", () => {
    render(<VerificationPage user={mockUser} />);

    expect(
      screen.getByRole("heading", { name: /Verify your email/i })
    ).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument();
  });

  it("reads the account again when the person says they have verified", async () => {
    vi.mocked(refreshAuth).mockResolvedValue({
      record: { ...mockUser, verified: true },
      token: "t"
    } as never);
    render(<VerificationPage user={mockUser} />);

    await userEvent.click(
      screen.getByRole("button", { name: /I've verified, continue/i })
    );

    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(notify.notifyWarning).not.toHaveBeenCalled();
  });

  it("says so when the account is still not verified", async () => {
    vi.mocked(refreshAuth).mockResolvedValue({
      record: mockUser,
      token: "t"
    } as never);
    render(<VerificationPage user={mockUser} />);

    await userEvent.click(
      screen.getByRole("button", { name: /I've verified, continue/i })
    );

    await waitFor(() =>
      expect(notify.notifyWarning).toHaveBeenCalledWith(
        expect.stringMatching(/Not verified yet/i)
      )
    );
  });

  it("sends the link again", async () => {
    vi.mocked(verifyEmail).mockResolvedValue(true);
    render(<VerificationPage user={mockUser} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Send the link again/i })
    );

    expect(verifyEmail).toHaveBeenCalledWith("test@example.com");
    await waitFor(() => expect(notify.notifySuccess).toHaveBeenCalled());
  });

  it("reports a failed resend", async () => {
    const error = new Error("nope");
    vi.mocked(verifyEmail).mockRejectedValue(error);
    render(<VerificationPage user={mockUser} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Send the link again/i })
    );

    await waitFor(() => expect(notify.notifyError).toHaveBeenCalledWith(error));
  });

  it("lets the person switch to another account", async () => {
    render(<VerificationPage user={mockUser} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Use another account/i })
    );

    expect(cleanupSession).toHaveBeenCalledTimes(1);
  });
});
