import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test/test-wrapper";
import { ENDGAME_PROGRESS_THRESHOLD } from "../../utils/constants";
import NextAvailable from "./nextavailable";

const setup = (progress: number, remaining = 3) => {
  const onClick = vi.fn();
  render(
    <NextAvailable
      remaining={remaining}
      progress={progress}
      onClick={onClick}
    />
  );
  return { onClick };
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
});
