import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/utils/test";
import ListPanel from "./list-panel";

const screenSize = vi.hoisted(() => ({ isMobile: false }));

vi.mock("../../hooks/use-mobile", () => ({
  useIsMobile: () => screenSize.isMobile
}));

const open = (onClose = vi.fn()) => {
  render(
    <ListPanel open onClose={onClose} title="Territories">
      <p>The list</p>
    </ListPanel>
  );
  return onClose;
};

describe("ListPanel", () => {
  beforeEach(() => {
    screenSize.isMobile = false;
  });

  it("is a centred dialog on a wide screen", () => {
    open();

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-slot",
      "dialog-content"
    );
    expect(screen.getByText("The list")).toBeInTheDocument();
  });

  it("is a sheet from the bottom on a phone", () => {
    screenSize.isMobile = true;
    open();

    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "bottom");
  });

  it("closes from its labelled button", async () => {
    const onClose = open();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });
});
