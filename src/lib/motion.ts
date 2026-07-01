import { type Transition, type Variants } from "motion/react";

// Shared spring base — reused in authlayout for inline transitions.
export const springBase = {
  type: "spring",
  visualDuration: 0.5,
  bounce: 0.25
} as const;

// Transforms → spring; opacity → linear fade long enough to be visible.
export const enterTransition: Transition = {
  default: springBase,
  opacity: { duration: 0.35, ease: "linear" }
};

// Matches the .map-content CSS transition duration in index.css.
// Table entrance animations use this as their base delay so they start
// after the page fade-in completes.
export const PAGE_ENTER_DELAY = 0.15;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: "linear" } }
};

// Delayed variant of fadeIn — lets a dialog finish opening before its content fades in.
export const fadeInDelayed: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.35, ease: "linear", delay: 0.2 }
  }
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: enterTransition }
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
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
      duration: 0.35,
      ease: "linear",
      delay: PAGE_ENTER_DELAY + (row + col) * 0.04
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
    const delay = PAGE_ENTER_DELAY + index * 0.04;
    return {
      opacity: 1,
      x: 0,
      transition: {
        default: { ...springBase, delay },
        opacity: { duration: 0.35, ease: "linear", delay }
      }
    };
  }
};

// Row headers (left column) — stagger top → bottom, each cell slides in from above.
export const rowHeader: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: ({ index }: { index: number }) => {
    const delay = PAGE_ENTER_DELAY + index * 0.04;
    return {
      opacity: 1,
      y: 0,
      transition: {
        default: { ...springBase, delay },
        opacity: { duration: 0.35, ease: "linear", delay }
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
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.18, delay },
        y: { duration: 0.18, delay }
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
      default: { type: "spring", visualDuration: 0.4, bounce: 0.45 },
      opacity: { duration: 0.2, ease: "linear" }
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
    transition: { type: "spring", visualDuration: 0.25, bounce: 0.5 }
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.12, ease: "easeIn" }
  }
};

// Quick exit upward — for content panels that enter with fadeSlideUp and need
// a snappy directional exit rather than a reverse of the entrance.
export const exitUp = {
  opacity: 0,
  y: -8,
  transition: { duration: 0.15, ease: "easeIn" }
} as const;

// Shared tap/press feedback — scale only (compositor, zero reflow, Safari-safe).
export const tapFeedback = { scale: 0.97 } as const;
