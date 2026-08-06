import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, setViewport, restoreBrowserStubs } from "../../utils/test";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from "./responsive-dialog";

const renderResponsiveDialog = () =>
  render(
    <ResponsiveDialog open onOpenChange={() => {}}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Responsive title</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <button>Ok</button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );

describe("ResponsiveDialog", () => {
  afterEach(() => {
    restoreBrowserStubs();
  });

  it("renders a centered dialog on desktop viewports", () => {
    setViewport(false);
    const { unmount } = renderResponsiveDialog();

    expect(screen.getByText("Responsive title")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="drawer-popup"]')).toBeNull();
    unmount();
  });

  it("renders a bottom-sheet drawer on mobile viewports", () => {
    setViewport(true);
    const { unmount } = renderResponsiveDialog();

    expect(screen.getByText("Responsive title")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="drawer-popup"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
    unmount();
  });
});
