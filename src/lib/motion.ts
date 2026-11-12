import { type Transition, type Variants } from "motion/react";

// The app's timing scale, in seconds; CSS mirrors it as --motion-fast/base/slow
// in index.css and Tailwind classes use duration-150/250/400. fast: presses,
// colour changes and exits. base: fades and most entrances. slow: deliberate
// moments. Ambient loops, chart draw-ins and map flights keep their own timing.
export const duration = { fast: 0.15, base: 0.25, slow: 0.4 } as const;

// The two springs. Calm moves anything large, such as pages, panels and cards,
// with no overshoot because the page moves with it. Close to the 200 ms the
// shadcn sidebar takes, so the two read as one motion when the navigation
// folds as the assistant opens.
export const springCalm: Transition = {
  type: "spring",
  visualDuration: duration.base,
  bounce: 0
};

// Pop is for small things that should feel tactile: status icons, badges,
// the completion check.
export const springPop: Transition = {
  type: "spring",
  visualDuration: duration.base,
  bounce: 0.4
};

// The docked panel's contents: in from the edge as the panel widens.
export const panelContent: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      ...springCalm,
      opacity: { duration: duration.base, ease: "linear" }
    }
  }
};

// A chat turn arriving: a short rise without bounce, so it reads as new
// without pulling the eye from the page.
export const messageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      default: springCalm,
      opacity: { duration: duration.base, ease: "linear" }
    }
  }
};

// Transforms → the calm spring, since these move whole cards and pages, where
// an overshoot reads as a wobble; opacity → linear fade.
export const enterTransition: Transition = {
  default: springCalm,
  opacity: { duration: duration.base, ease: "linear" }
};

// Matches the .map-content CSS transition duration in index.css.
// Table entrance animations use this as their base delay so they start
// after the page fade-in completes.
export const PAGE_ENTER_DELAY = duration.fast;

// Grid cells and headers step 40 ms apart, capped so a tall building is not
// still filling in a second later; past the cap the rest arrive together.
const gridDelay = (steps: number) =>
  PAGE_ENTER_DELAY + Math.min(steps * 0.04, 0.4);

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: "linear" } }
};

// Delayed variant of fadeIn — lets a dialog finish opening before its content fades in.
export const fadeInDelayed: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: duration.base, ease: "linear", delay: 0.2 }
  }
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: enterTransition }
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: enterTransition }
};

export const fadeZoom: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: enterTransition }
};

// Diagonal wave for grid/table cells. Pass custom={{ row, col }} on each m.* element.
// Cells along the same top-left→bottom-right diagonal animate simultaneously.
// Opacity-only: the staggered delay creates the wave, while a linear opacity tween
// stays on the compositor (GPU) instead of running a per-cell spring on the main thread.
export const diagonalCell: Variants = {
  hidden: { opacity: 0 },
  show: ({ row, col }: { row: number; col: number }) => ({
    opacity: 1,
    transition: {
      duration: duration.base,
      ease: "linear",
      delay: gridDelay(row + col)
    }
  })
};

// Parent that cascades children's entrance via stagger.
// delay: seconds before first child animates (use PAGE_ENTER_DELAY when
// the parent is under the map-content page wrapper).
export const staggerContainer = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } }
});

// Column headers (top row) — stagger left → right, each cell slides in from left.
export const columnHeader: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: ({ index }: { index: number }) => {
    const delay = gridDelay(index);
    return {
      opacity: 1,
      x: 0,
      transition: {
        default: { ...springCalm, delay },
        opacity: { duration: duration.base, ease: "linear", delay }
      }
    };
  }
};

// Row headers (left column) — stagger top → bottom, each cell slides in from above.
export const rowHeader: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: ({ index }: { index: number }) => {
    const delay = gridDelay(index);
    return {
      opacity: 1,
      y: 0,
      transition: {
        default: { ...springCalm, delay },
        opacity: { duration: duration.base, ease: "linear", delay }
      }
    };
  }
};

// Sortable list item entrance — staggers in by position, then keeps `layout`
// spring smooth for drag-reorder. Pass custom={{ delayIndex }} on each item.
export const sortableItemEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: ({ delayIndex }: { delayIndex: number }) => {
    const delay = Math.min(delayIndex * 0.035, 0.35);
    return {
      opacity: 1,
      y: 0,
      transition: {
        layout: springCalm,
        opacity: { duration: duration.fast, delay },
        y: { duration: duration.fast, delay }
      }
    };
  }
};

// Completion checkmark entrance — spring with intentional overshoot for reward feedback.
export const checkEnter: Variants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -15 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      default: springPop,
      opacity: { duration: duration.fast, ease: "linear" }
    }
  }
};

// Count badge pop — spring scale entrance, replayed on every count change via
// key-remount. Draws the eye when an assignment/message count appears or increments.
export const countPop: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: springPop
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: duration.fast, ease: "easeIn" }
  }
};

// Quick exit upward — for content panels that enter with fadeSlideUp and need
// a snappy directional exit rather than a reverse of the entrance.
export const exitUp = {
  opacity: 0,
  y: -8,
  transition: { duration: duration.fast, ease: "easeIn" }
} as const;

// Shared tap/press feedback — scale only (compositor, zero reflow, Safari-safe).
export const tapFeedback = { scale: 0.97 } as const;
