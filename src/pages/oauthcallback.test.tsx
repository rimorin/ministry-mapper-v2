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

  it("reports the provider's error without attempting an exchange", async () => {
    await renderCallback("?error=access_denied");

    await waitFor(() => {
      expect(mocks.notifyError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "access_denied" })
      );
    });
    expect(mocks.completeOAuth2Flow).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
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
