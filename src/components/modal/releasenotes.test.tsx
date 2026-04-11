import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../utils/test";
import NiceModal from "@ebay/nice-modal-react";
import ReleaseNotesModal from "./releasenotes";
import type { ReleaseEntry } from "../../hooks/useReleaseNotes";

NiceModal.register("release-notes", ReleaseNotesModal);

const show = (releases: ReleaseEntry[], onSeen = vi.fn()) =>
  NiceModal.show(ReleaseNotesModal, { releases, onSeen });

const englishRelease: ReleaseEntry = {
  id: "2026-04-08",
  notice: "Plain notice",
  screenshot: null,
  items: [
    {
      type: "new",
      text: "Plain text feature",
      description: "A description.\n- Step one\n- Step two"
    },
    { type: "fix", text: "Plain fix" },
    { type: "improved", text: "Plain improvement" },
    { type: "announcement", text: "Plain announcement" }
  ]
};

const localizedRelease: ReleaseEntry = {
  id: "2026-04-08",
  notice: { en: "English notice", zh: "中文公告" },
  screenshot: null,
  items: [
    {
      type: "new",
      text: { en: "English feature", zh: "中文功能" },
      description: { en: "English description.", zh: "中文描述。" }
    }
  ]
};

const missingLocaleRelease: ReleaseEntry = {
  id: "2026-04-08",
  notice: { en: "English only notice" },
  screenshot: null,
  items: [{ type: "new", text: { en: "English only text" } }]
};

describe("ReleaseNotesModal", () => {
  it("renders the modal title and dismiss button", async () => {
    const { unmount } = render(<></>);
    show([englishRelease]);
    await waitFor(() =>
      expect(screen.getByText("What's New")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    unmount();
  });

  it("renders plain string notice, text, and description", async () => {
    const { unmount } = render(<></>);
    show([englishRelease]);
    await waitFor(() =>
      expect(screen.getByText("Plain notice")).toBeInTheDocument()
    );
    expect(screen.getByText("Plain text feature")).toBeInTheDocument();
    expect(screen.getByText("A description.")).toBeInTheDocument();
    expect(screen.getByText("Step one")).toBeInTheDocument();
    unmount();
  });

  it("renders item type badges", async () => {
    const { unmount } = render(<></>);
    show([englishRelease]);
    await waitFor(() => expect(screen.getByText("New")).toBeInTheDocument());
    expect(screen.getByText("Fix")).toBeInTheDocument();
    expect(screen.getByText("Improved")).toBeInTheDocument();
    expect(screen.getByText("Announcement")).toBeInTheDocument();
    unmount();
  });

  it("renders the Latest badge on the first release", async () => {
    const { unmount } = render(<></>);
    show([englishRelease]);
    await waitFor(() => expect(screen.getByText("Latest")).toBeInTheDocument());
    unmount();
  });

  it("renders localized content for the current language (en)", async () => {
    const { unmount } = render(<></>);
    show([localizedRelease]);
    await waitFor(() =>
      expect(screen.getByText("English notice")).toBeInTheDocument()
    );
    expect(screen.getByText("English feature")).toBeInTheDocument();
    expect(screen.getByText("English description.")).toBeInTheDocument();
    unmount();
  });

  it("falls back to English when the current locale has no translation", async () => {
    const { unmount } = render(<></>);
    show([missingLocaleRelease]);
    await waitFor(() =>
      expect(screen.getByText("English only notice")).toBeInTheDocument()
    );
    expect(screen.getByText("English only text")).toBeInTheDocument();
    unmount();
  });

  it("calls onSeen and closes when Dismiss is clicked", async () => {
    const onSeen = vi.fn();
    const { unmount } = render(<></>);
    show([englishRelease], onSeen);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Dismiss" })
      ).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onSeen).toHaveBeenCalledOnce();
    unmount();
  });

  it("closes without error when onSeen is omitted", async () => {
    const { unmount } = render(<></>);
    NiceModal.show(ReleaseNotesModal, { releases: [englishRelease] });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Dismiss" })
      ).toBeInTheDocument()
    );

    await expect(
      userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    ).resolves.not.toThrow();
    unmount();
  });
});
