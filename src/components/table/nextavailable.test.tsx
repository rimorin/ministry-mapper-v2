import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, userEvent } from "../../utils/test/test-wrapper";
import { ENDGAME_PROGRESS_THRESHOLD } from "../../utils/constants";
import { ANALYTICS_EVENTS } from "../../utils/analytics";
import NextAvailable from "./nextavailable";

type Umami = NonNullable<Window["umami"]>;

const mockTrack = vi.fn();

beforeEach(() => {
  window.umami = { track: mockTrack, identify: vi.fn() } as unknown as Umami;
});

afterEach(() => {
  vi.clearAllMocks();
  delete window.umami;
});

const setup = (
  progress: number,
  remaining = 3,
  surface: "admin" | "publisher" = "admin"
) => {
  const onClick = vi.fn();
  const view = render(
    <NextAvailable
      remaining={remaining}
      progress={progress}
      surface={surface}
      onClick={onClick}
    />
  );
  return { onClick, view };
};

const button = () => screen.queryByRole("button");

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

  it("counts the addresses that are left", () => {
    setup(95, 3);
    expect(screen.getByRole("button")).toHaveTextContent("3");
  });

  it("stays hidden at full progress even though the map is in its endgame", () => {
    setup(100, 0);
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
      const { view } = setup(95, 3);
      view.rerender(
        <NextAvailable
          remaining={2}
          progress={97}
          surface="admin"
          onClick={vi.fn()}
        />
      );

      expect(
        mockTrack.mock.calls.filter(
          (call) => call[0] === ANALYTICS_EVENTS.NEXT_ADDRESS_OFFERED
        )
      ).toHaveLength(1);
    });

    it("reports a fresh offer when a map re-enters its endgame", () => {
      const { view } = setup(95, 3);
      const rerender = (remaining: number, progress: number) =>
        view.rerender(
          <NextAvailable
            remaining={remaining}
            progress={progress}
            surface="admin"
            onClick={vi.fn()}
          />
        );

      rerender(0, 100);
      rerender(1, 96);

      expect(
        mockTrack.mock.calls.filter(
          (call) => call[0] === ANALYTICS_EVENTS.NEXT_ADDRESS_OFFERED
        )
      ).toHaveLength(2);
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
