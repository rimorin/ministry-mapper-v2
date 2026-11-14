import { useEffect, useState, type RefObject } from "react";

// True while the element has content past its right edge, so a fade can hint
// at it; false once scrolled to the end or when nothing overflows.
const useCanScrollRight = (ref: RefObject<HTMLElement | null>) => {
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setCanScrollRight(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1
      );
    update();
    element.addEventListener("scroll", update, { passive: true });
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    resizeObserver?.observe(element);
    for (const child of element.children) resizeObserver?.observe(child);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(element, { childList: true, subtree: true });
    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref]);

  return canScrollRight;
};

export default useCanScrollRight;
