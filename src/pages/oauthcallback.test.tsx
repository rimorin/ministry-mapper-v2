import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  completeOAuth2Flow: vi.fn(),
  notifyError: vi.fn(),
  trackEvent: vi.fn(),
  navigate: vi.fn()
}));

vi.mock("../utils/pocketbase", () => ({
  completeOAuth2Flow: mocks.completeOAuth2Flow
}));
vi.mock("../hooks/useNotification", () => ({
  default: () => ({ notifyError: mocks.notifyError })
}));
vi.mock("../hooks/useAnalytics", () => ({
  default: () => ({ trackEvent: mocks.trackEvent }),
  ANALYTICS_EVENTS: { LOGIN_OAUTH: "login-oauth" }
}));
vi.mock("wouter", () => ({
  useLocation: () => ["/auth/callback", mocks.navigate]
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_: string, fallback: string) => fallback })
}));

const renderCallback = async (search: string) => {
  Object.defineProperty(window, "location", {
    value: { search },
    writable: true
  });
  const { default: OAuthCallback } = await import("./oauthcallback");
  return render(<OAuthCallback />);
};

describe("OAuthCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.completeOAuth2Flow.mockResolvedValue("google");
  });

  it("exchanges the code and returns to the front page", async () => {
    await renderCallback("?code=code123&state=state123");

    await waitFor(() => {
      expect(mocks.completeOAuth2Flow).toHaveBeenCalledWith(
        "code123",
        "state123"
      );
    });
    expect(mocks.trackEvent).toHaveBeenCalledWith("login-oauth", {
      provider: "google"
    });
    expect(mocks.notifyError).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("returns quietly when the user dismisses the provider's screen", async () => {
    await renderCallback("?error=access_denied");

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.notifyError).not.toHaveBeenCalled();
    expect(mocks.completeOAuth2Flow).not.toHaveBeenCalled();
  });

  it("reports other provider errors with a translated message", async () => {
    await renderCallback("?error=server_error");

    await waitFor(() => {
      expect(mocks.notifyError).toHaveBeenCalledWith(
        "Google sign-in could not be completed. Please try again."
      );
    });
    expect(mocks.completeOAuth2Flow).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("returns quietly when no sign-in is in progress", async () => {
    mocks.completeOAuth2Flow.mockResolvedValue(null);

    await renderCallback("?code=code123&state=state123");

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.notifyError).not.toHaveBeenCalled();
    expect(mocks.trackEvent).not.toHaveBeenCalled();
  });

  it("returns quietly on a direct visit with no query", async () => {
    await renderCallback("");

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(mocks.notifyError).not.toHaveBeenCalled();
    expect(mocks.completeOAuth2Flow).not.toHaveBeenCalled();
  });

  it("reports a failed exchange and still returns to the front page", async () => {
    mocks.completeOAuth2Flow.mockRejectedValue(
      new Error("State parameters don't match.")
    );

    await renderCallback("?code=code123&state=tampered");

    await waitFor(() => {
      expect(mocks.notifyError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "State parameters don't match." })
      );
    });
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
