import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, userEvent } from "../../utils/test/test-wrapper";
import { ENDGAME_PROGRESS_THRESHOLD } from "../../utils/constants";
import { ANALYTICS_EVENTS } from "../../utils/analytics";
import NextAvailable, {
  NextAddressSlotContext,
  type NextAddressSlotValue
} from "./nextavailable";

type Umami = NonNullable<Window["umami"]>;

const mockTrack = vi.fn();
const targets: HTMLElement[] = [];

beforeEach(() => {
  window.umami = { track: mockTrack, identify: vi.fn() } as unknown as Umami;
});

afterEach(() => {
  vi.clearAllMocks();
  delete window.umami;
  targets.splice(0).forEach((target) => target.remove());
});

const setup = (
  progress: number,
  remaining = 3,
  surface: NextAddressSlotValue["surface"] = "admin",
  isFiltered = false
) => {
  const target = document.createElement("div");
  document.body.appendChild(target);
  targets.push(target);

  const onClick = vi.fn();
  const slot: NextAddressSlotValue = {
    target,
    surface,
    renderButton: (handleClick) => (
      <button type="button" onClick={handleClick}>
        Next
      </button>
    )
  };
  const inSlot = (ui: ReactElement) => (
    <NextAddressSlotContext.Provider value={slot}>
      {ui}
    </NextAddressSlotContext.Provider>
  );

  const view = render(
    inSlot(
      <NextAvailable
        remaining={remaining}
        progress={progress}
        isFiltered={isFiltered}
        onClick={onClick}
      />
    )
  );
  const rerender = (nextRemaining: number, nextProgress: number) =>
    view.rerender(
      inSlot(
        <NextAvailable
          remaining={nextRemaining}
          progress={nextProgress}
          isFiltered={isFiltered}
          onClick={onClick}
        />
      )
    );

  return { target, onClick, rerender };
};

const button = () => screen.queryByRole("button");

const offerCount = () =>
  mockTrack.mock.calls.filter(
    (call) => call[0] === ANALYTICS_EVENTS.NEXT_ADDRESS_OFFERED
  ).length;

describe("NextAvailable", () => {
  it("stays hidden while most of the map still needs calling", () => {
    setup(6, 47);
    expect(button()).not.toBeInTheDocument();
  });

  it("stays hidden just below the endgame", () => {
    setup(ENDGAME_PROGRESS_THRESHOLD - 1);
    expect(button()).not.toBeInTheDocument();
  });

  it("appears once the map reaches its endgame", () => {
    setup(ENDGAME_PROGRESS_THRESHOLD);
    expect(button()).toBeInTheDocument();
  });

  it("appears before the endgame when a filter is narrowing the map", () => {
    setup(6, 4, "publisher", true);
    expect(button()).toBeInTheDocument();
  });

  it("stays hidden at full progress even though the map is in its endgame", () => {
    setup(100, 0);
    expect(button()).not.toBeInTheDocument();
  });

  it("renders into the slot the page provides", () => {
    const { target } = setup(95);
    expect(target).toContainElement(screen.getByRole("button"));
  });

  it("stays hidden when the page provides no slot", () => {
    render(
      <NextAvailable
        remaining={3}
        progress={95}
        isFiltered={false}
        onClick={vi.fn()}
      />
    );
    expect(button()).not.toBeInTheDocument();
  });

  it("asks for the next address when tapped", async () => {
    const { onClick } = setup(95);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("analytics", () => {
    it("reports the offer when the button appears", () => {
      setup(95, 3, "publisher");

      expect(mockTrack).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.NEXT_ADDRESS_OFFERED,
        { surface: "publisher" }
      );
    });

    it("reports no offer while the button is hidden", () => {
      setup(ENDGAME_PROGRESS_THRESHOLD - 1);
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("reports no offer once nothing is left", () => {
      setup(100, 0);
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("counts one offer per endgame, not per render", () => {
      const { rerender } = setup(95, 3);
      rerender(2, 97);
      expect(offerCount()).toBe(1);
    });

    it("reports a fresh offer when a map re-enters its endgame", () => {
      const { rerender } = setup(95, 3);
      rerender(0, 100);
      rerender(1, 96);
      expect(offerCount()).toBe(2);
    });

    it("reports the use alongside the offer when tapped", async () => {
      const { onClick } = setup(95, 3, "admin");
      await userEvent.click(screen.getByRole("button"));

      expect(mockTrack).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.NEXT_ADDRESS_USED,
        { surface: "admin" }
      );
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
