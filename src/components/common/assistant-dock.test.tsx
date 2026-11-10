import { describe, it, expect, afterEach, vi } from "vitest";
import { useState } from "react";
import { LazyMotion, domAnimation } from "motion/react";
import { render, screen, userEvent, waitFor } from "@/utils/test";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

vi.mock("../modal/assistant", () => ({
  AssistantChat: ({ onClose }: { onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      Chat
    </button>
  )
}));

const { default: AssistantDock, MAX_WIDTH } = await import("./assistant-dock");

const NavState = () => {
  const { open } = useSidebar();
  return <p>{open ? "nav open" : "nav folded"}</p>;
};

const dock = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width
  });
  const onClose = vi.fn();
  const view = render(
    <LazyMotion features={domAnimation}>
      <SidebarProvider>
        <NavState />
        <AssistantDock
          congregation="c1"
          onSelectTerritory={vi.fn()}
          onClose={onClose}
        />
      </SidebarProvider>
    </LazyMotion>
  );
  return { ...view, onClose };
};

describe("AssistantDock", () => {
  it("closes on Escape", async () => {
    const { onClose } = dock(1600);
    screen.getByRole("separator").focus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {
      // storage can be unavailable
    }
  });

  it("folds the navigation on a narrow screen and brings it back on close", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1200
    });
    const Page = () => {
      const [open, setOpen] = useState(true);
      return (
        <LazyMotion features={domAnimation}>
          <SidebarProvider>
            <NavState />
            {open && (
              <AssistantDock
                congregation="c1"
                onSelectTerritory={vi.fn()}
                onClose={() => setOpen(false)}
              />
            )}
          </SidebarProvider>
        </LazyMotion>
      );
    };
    render(<Page />);
    await userEvent.click(await screen.findByText("Chat"));
    // The panel folded it on opening and unfolds it on closing.
    await waitFor(() =>
      expect(screen.getByText("nav open")).toBeInTheDocument()
    );
  });

  it("leaves the navigation alone on a wide screen", async () => {
    dock(1600);
    await screen.findByText("Chat");
    expect(screen.getByText("nav open")).toBeInTheDocument();
  });

  it("folds the navigation on a narrow screen", async () => {
    dock(1200);
    await screen.findByText("Chat");
    expect(screen.getByText("nav folded")).toBeInTheDocument();
  });

  it("resizes from the keyboard, within bounds, and remembers the width", async () => {
    dock(1600);
    const handle = screen.getByRole("separator", {
      name: "Resize the assistant"
    });
    expect(handle).toHaveAttribute("aria-valuenow", "420");
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "460");
    expect(localStorage.getItem("assistant-panel-width")).toBe("460");
    for (let i = 0; i < 20; i++) await userEvent.keyboard("{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", String(MAX_WIDTH));
  });

  it("is a labelled side region, not a dialog", async () => {
    const { onClose } = dock(1600);
    expect(
      screen.getByRole("complementary", { name: "Mapper Assistant" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(await screen.findByText("Chat"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("moves the page's floating buttons in by its width while open", async () => {
    const { unmount } = dock(1600);
    await screen.findByText("Chat");
    const root = document.documentElement;
    // Set as the panel widens, ending at its width.
    await waitFor(() =>
      expect(root.style.getPropertyValue("--assistant-dock-width")).toBe(
        "420px"
      )
    );
    const handle = screen.getByRole("separator", {
      name: "Resize the assistant"
    });
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(root.style.getPropertyValue("--assistant-dock-width")).toBe(
        "440px"
      )
    );
    unmount();
    expect(root.style.getPropertyValue("--assistant-dock-width")).toBe("");
  });
});
