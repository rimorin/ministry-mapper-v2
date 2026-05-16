import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as pocketbase from "../utils/pocketbase";

vi.mock("../utils/pocketbase", () => ({
  authListener: vi.fn(() => () => {}),
  getUser: vi.fn().mockReturnValue(null),
  refreshAuth: vi.fn().mockResolvedValue({})
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_: string, fallback: string) => fallback })
}));
vi.mock("../components/navigation/branding", () => ({ default: () => null }));
vi.mock("../components/navigation/button", () => ({ default: () => null }));
vi.mock("../components/navigation/themetoggle", () => ({
  default: () => null
}));
vi.mock("../components/navigation/releasehistorybtn", () => ({
  default: () => null
}));
vi.mock("../components/navigation/languagebtn", () => ({
  default: () => null
}));
vi.mock("../components/navigation/verification", () => ({
  default: () => null
}));
vi.mock("../i18n/LanguageSelector", () => ({ default: () => null }));
vi.mock("../hooks/useUIManagement", () => ({
  default: () => ({
    showLanguageSelector: false,
    toggleLanguageSelector: vi.fn()
  })
}));
vi.mock("../components/utils/suspense", () => ({
  default: (Component: React.ComponentType) => Component
}));
vi.mock("./signup", () => ({ default: () => null }));
vi.mock("./signin", () => ({ default: () => null }));
vi.mock("./forgot", () => ({ default: () => null }));
vi.mock("./admin/index", () => ({ default: () => null }));
vi.mock("../components/statics/releasenotifier", () => ({
  ReleaseNotifier: () => null
}));

const mockUser = { id: "user123", verified: true } as unknown as ReturnType<
  typeof pocketbase.getUser
>;

const renderFrontPage = async () => {
  const { default: FrontPage } = await import("./frontpage");
  return render(<FrontPage />);
};

describe("FrontPage — auth refresh on mount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pocketbase.authListener).mockReturnValue(() => {});
    vi.mocked(pocketbase.refreshAuth).mockResolvedValue({} as never);
  });

  it("calls refreshAuth on mount when a user is already logged in", async () => {
    vi.mocked(pocketbase.getUser).mockReturnValue(mockUser);

    await renderFrontPage();

    await waitFor(() => {
      expect(pocketbase.refreshAuth).toHaveBeenCalledOnce();
    });
  });

  it("does not call refreshAuth when no user is logged in", async () => {
    vi.mocked(pocketbase.getUser).mockReturnValue(null);

    await renderFrontPage();

    await waitFor(() => {
      expect(pocketbase.refreshAuth).not.toHaveBeenCalled();
    });
  });

  it("does not throw when refreshAuth fails", async () => {
    vi.mocked(pocketbase.getUser).mockReturnValue(mockUser);
    vi.mocked(pocketbase.refreshAuth).mockRejectedValue(new Error("network"));

    await expect(renderFrontPage()).resolves.not.toThrow();
  });
});
