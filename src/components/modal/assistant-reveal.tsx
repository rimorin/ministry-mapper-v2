import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

import { messageEnter } from "@/lib/motion";

// Each frame shows this share of the text not yet shown, so a burst from the
// network eases in over a few frames and a steady stream reads as steady
// writing, never falling far behind.
const REVEAL_SHARE = 6;
// How long a piece takes to fade in; matches the animation on its span.
const FADE_MS = 300;

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// The first character boundary at or after index, so a piece never splits an
// emoji or a letter from its vowel sign.
const boundaryFrom = (text: string, index: number) => {
  const segment = graphemes.segment(text).containing(index);
  return !segment || segment.index === index
    ? Math.min(index, text.length)
    : segment.index + segment.segment.length;
};

interface AnswerRevealProps {
  text: string;
  // Off for an answer brought back from history: it shows as it is.
  animate: boolean;
  // What follows the answer (its actions, cards and follow-ups), shown once
  // all of the text has appeared.
  children?: ReactNode;
}

// A piece of the answer still fading in: where it ends and when it appeared,
// stamped on the frame that first shows it.
interface Piece {
  end: number;
  at?: number;
}

// An answer appearing as it is written: the text is revealed at an even pace,
// each new piece fading in. Pieces that have faded in join the plain text
// before them, so only the last few are separate.
export function AnswerReveal({ text, animate, children }: AnswerRevealProps) {
  const reduceMotion = useReducedMotion();
  const still = !animate || reduceMotion === true;
  const [reveal, setReveal] = useState<{ settled: number; pieces: Piece[] }>({
    settled: 0,
    pieces: []
  });
  // Bumped when the text starts over, so its pieces fade in afresh.
  const [generation, setGeneration] = useState(0);
  const [previous, setPrevious] = useState(text);
  const { settled, pieces } = reveal;
  const shown = pieces.at(-1)?.end ?? settled;

  if (text !== previous) {
    setPrevious(text);
    // Text that no longer continues what is shown (withdrawn, or a final
    // answer unlike its draft) starts over at once.
    if (!text.startsWith(previous.slice(0, shown))) {
      setReveal({ settled: 0, pieces: text ? [{ end: text.length }] : [] });
      setGeneration((count) => count + 1);
    }
  }

  const moving = !still && (shown < text.length || pieces.length > 0);
  useEffect(() => {
    if (!moving) return;
    const frame = requestAnimationFrame((now) =>
      setReveal((current) => {
        const stamped = current.pieces.map((piece) => ({
          end: piece.end,
          at: piece.at ?? now
        }));
        const fading = stamped.filter((piece) => now - piece.at < FADE_MS);
        const faded = stamped.length - fading.length;
        const end = stamped.at(-1)?.end ?? current.settled;
        return {
          settled: faded ? stamped[faded - 1].end : current.settled,
          pieces:
            end < text.length
              ? [
                  ...fading,
                  {
                    end: boundaryFrom(
                      text,
                      end + Math.ceil((text.length - end) / REVEAL_SHARE)
                    )
                  }
                ]
              : fading
        };
      })
    );
    return () => cancelAnimationFrame(frame);
  }, [moving, text, reveal]);

  const revealed = still || shown >= text.length;
  return (
    <>
      <p className="whitespace-pre-wrap">
        {still ? (
          text
        ) : (
          <>
            {text.slice(0, settled)}
            {pieces.map((piece, index) => (
              <span
                key={`${generation}-${piece.end}`}
                className="animate-[fade-in_0.3s_linear]"
              >
                {text.slice(pieces[index - 1]?.end ?? settled, piece.end)}
              </span>
            ))}
          </>
        )}
      </p>
      {revealed && children && (
        <m.div
          className="flex flex-col gap-3"
          initial={still ? false : "hidden"}
          animate="show"
          variants={messageEnter}
        >
          {children}
        </m.div>
      )}
    </>
  );
}
