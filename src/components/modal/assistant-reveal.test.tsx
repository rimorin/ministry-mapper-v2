import { describe, expect, it } from "vitest";

import { render, screen, waitFor } from "@/utils/test";
import { AnswerReveal } from "./assistant-reveal";

const shownText = (container: HTMLElement) =>
  container.querySelector("p")?.textContent;

// Records each piece as it appears, before it fades in and joins the text.
const recordPieces = (container: HTMLElement) => {
  const pieces: string[] = [];
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLSpanElement)
          pieces.push(node.textContent ?? "");
      }
    }
  }).observe(container.querySelector("p")!, { childList: true });
  return pieces;
};

describe("AnswerReveal", () => {
  it("reveals the text a piece at a time, then what follows it", async () => {
    const text = "M03 has the most nobody-home homes, with 458.";
    const { container } = render(
      <AnswerReveal text={text} animate>
        <button type="button">Copy answer</button>
      </AnswerReveal>
    );

    const pieces = recordPieces(container);

    expect(shownText(container)).not.toBe(text);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await waitFor(() => expect(shownText(container)).toBe(text));
    expect(pieces.length).toBeGreaterThan(1);
    expect(
      await screen.findByRole("button", { name: "Copy answer" })
    ).toBeInTheDocument();
    // Once faded in, the pieces are plain text again.
    await waitFor(() => expect(container.querySelector("p > span")).toBeNull());
    expect(shownText(container)).toBe(text);
  });

  it("follows a growing draft and starts over when it is withdrawn", async () => {
    const { container, rerender } = render(
      <AnswerReveal text="T01 has " animate />
    );
    await waitFor(() => expect(shownText(container)).toBe("T01 has "));

    rerender(<AnswerReveal text="T01 has not been completed." animate />);
    await waitFor(() =>
      expect(shownText(container)).toBe("T01 has not been completed.")
    );

    rerender(<AnswerReveal text="" animate />);
    expect(shownText(container)).toBe("");
    rerender(<AnswerReveal text="T02 is done." animate />);
    await waitFor(() => expect(shownText(container)).toBe("T02 is done."));
  });

  it("never splits a character between pieces", async () => {
    const text = "Done 👍🏽 — வீடுகள் 😀😀😀😀😀😀😀😀";
    const { container } = render(<AnswerReveal text={text} animate />);
    const pieces = recordPieces(container);
    await waitFor(() => expect(shownText(container)).toBe(text));

    expect(pieces.length).toBeGreaterThan(1);
    // Every piece ends where a whole character ends.
    const boundaries = new Set(
      [
        ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
          text
        )
      ].map(({ index, segment }) => index + segment.length)
    );
    let end = 0;
    for (const piece of pieces) {
      end += piece.length;
      expect(boundaries.has(end)).toBe(true);
    }
  });

  it("shows an answer from history as it is", () => {
    const { container } = render(
      <AnswerReveal text="T01 has not been completed." animate={false}>
        <button type="button">Copy answer</button>
      </AnswerReveal>
    );

    expect(shownText(container)).toBe("T01 has not been completed.");
    expect(container.querySelector("p > span")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Copy answer" })
    ).toBeInTheDocument();
  });
});
