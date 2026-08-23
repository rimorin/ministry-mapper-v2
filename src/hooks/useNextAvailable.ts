import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { unitDetails } from "../utils/interface";
import type { Policy } from "../utils/policies";

// scrollIntoView would scroll every ancestor too, and on the admin page the grid
// is a fixed-height box inside a page that scrolls. Centring within the container
// keeps the jump local, and clears the sticky header and floor column.
const centreInContainer = (
  container: HTMLElement,
  cell: HTMLElement,
  smooth: boolean
) => {
  const view = container.getBoundingClientRect();
  const target = cell.getBoundingClientRect();
  container.scrollTo({
    top:
      container.scrollTop +
      (target.top - view.top) -
      (view.height - target.height) / 2,
    left:
      container.scrollLeft +
      (target.left - view.left) -
      (view.width - target.width) / 2,
    behavior: smooth ? "smooth" : "auto"
  });
};

// units arrive in reading order: buildFloorList sorts floors top-down and units
// by sequence, so the grid's own order is the tour order.
const useNextAvailable = (units: unitDetails[], policy: Policy) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastTargetId, setLastTargetId] = useState<string>();
  const shouldReduceMotion = useReducedMotion();

  const available = units.filter((unit) => policy.isAvailable(unit));

  const goToNext = () => {
    // Resume from wherever the last jump landed — searching the full list, not
    // just the available ones, keeps the place even after that unit is done.
    const from = units.findIndex((unit) => unit.id === lastTargetId);
    const next =
      units.find((unit, index) => index > from && policy.isAvailable(unit)) ??
      available[0];
    if (!next) return;

    setLastTargetId(next.id);
    const container = containerRef.current;
    const cell = container?.querySelector<HTMLElement>(
      `[data-id="${next.id}"]`
    );
    if (container && cell) {
      centreInContainer(container, cell, !shouldReduceMotion);
    }
  };

  return {
    containerRef,
    remaining: available.length,
    // Drop the ring once its unit is done, so a finished map is left unmarked.
    targetId: available.some((unit) => unit.id === lastTargetId)
      ? lastTargetId
      : undefined,
    goToNext
  };
};

export default useNextAvailable;
