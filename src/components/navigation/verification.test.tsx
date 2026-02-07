import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../../utils/test";
import userEvent from "@testing-library/user-event";
import VerificationPage from "./verification";

vi.mock("../../utils/pocketbase", () => ({
  cleanupSession: vi.fn(),
  verifyEmail: vi.fn()
}));

vi.mock("../../hooks/useNotification", () => ({
  default: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn()
  })
}));

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

  it("should render verification message", () => {
    render(<VerificationPage user={mockUser} />);

    expect(
      screen.getByText(/Please verify your email address to continue/i)
    ).toBeInTheDocument();
  });

  it("should render ministry mapper logo", () => {
    render(<VerificationPage user={mockUser} />);

    const logo = screen.getByAltText(/Ministry Mapper logo/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("android-chrome")
    );
  });

  it("should render resend verification email link", () => {
    render(<VerificationPage user={mockUser} />);

    expect(
      screen.getByRole("button", { name: /Resend verification email/i })
    ).toBeInTheDocument();
  });

  it("should render use another account button", () => {
    render(<VerificationPage user={mockUser} />);

    expect(
      screen.getByRole("button", { name: /use another account/i })
    ).toBeInTheDocument();
  });

  it("should call verifyEmail when resend link is clicked", async () => {
    const { verifyEmail } = await import("../../utils/pocketbase");
    const user = userEvent.setup();

    render(<VerificationPage user={mockUser} />);

    const resendLink = screen.getByRole("button", {
      name: /Resend verification email/i
    });
    await user.click(resendLink);

    expect(verifyEmail).toHaveBeenCalledWith(mockUser.email);
  });

  it("should call cleanupSession when use another account is clicked", async () => {
    const { cleanupSession } = await import("../../utils/pocketbase");
    const user = userEvent.setup();

    render(<VerificationPage user={mockUser} />);

    const button = screen.getByRole("button", {
      name: /use another account/i
    });
    await user.click(button);

    expect(cleanupSession).toHaveBeenCalledTimes(1);
  });
});
