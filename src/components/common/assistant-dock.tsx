import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent
} from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { panelContent, panelTransition } from "@/lib/motion";
import { useSidebar } from "@/components/ui/sidebar";
import type { AssistantView } from "../../hooks/useAssistant";
import type { CongregationSettings } from "../../utils/assistantActions";
import { safeStorage } from "../../utils/safeStorage";
import { Spinner } from "@/components/ui/spinner";

const loadChat = () => import("../modal/assistant");

// Fetches the chat ahead of time, so the panel opens on the conversation
// rather than a spinner. Safe to call more than once.
export const preloadAssistantChat = () => {
  void loadChat();
};

const AssistantChat = lazy(() =>
  loadChat().then((module) => ({ default: module.AssistantChat }))
);

const WIDTH_KEY = "assistant-panel-width";
const DOCK_WIDTH_VAR = "--assistant-dock-width";
const MIN_WIDTH = 360;
export const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 420;
// Below this the navigation, the page and the panel do not all fit, so the
// navigation folds away while the panel is open.
const NARROW_SCREEN = 1400;

const clampWidth = (width: number) =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));

const savedWidth = () => {
  const saved = Number(safeStorage.get(WIDTH_KEY));
  return saved ? clampWidth(saved) : DEFAULT_WIDTH;
};

interface AssistantDockProps {
  congregation: string;
  role?: string;
  origin?: string;
  view?: AssistantView;
  onSelectTerritory: (territoryId: string) => void;
  onSettingsChange?: (settings: CongregationSettings) => void;
  onClose: () => void;
}

// The assistant docked on the right of the page, beside it rather than over
// it, so the admin can keep working while the conversation stays open.
const AssistantDock = ({ onClose, ...chat }: AssistantDockProps) => {
  const { t } = useTranslation();
  const { open: navOpen, setOpen: setNavOpen } = useSidebar();
  const [width, setWidth] = useState(savedWidth);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = useReducedMotion();
  // Closing hands focus back to whatever opened the panel, usually its
  // sidebar item.
  const opener = useRef<Element | null>(document.activeElement);
  useEffect(
    () => () => {
      const element = opener.current;
      if (element instanceof HTMLElement && element.isConnected)
        element.focus();
    },
    []
  );

  // Fold the navigation on narrow screens while open, and bring it back on
  // close only if it was this panel that folded it.
  useEffect(() => {
    const folded = window.innerWidth < NARROW_SCREEN && navOpen;
    if (folded) setNavOpen(false);
    return () => {
      if (folded) setNavOpen(true);
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- only when the panel opens and closes
  }, []);

  // The page's floating buttons, toasts and the environment badge sit at its
  // right edge; while the panel is open that edge is the panel's, so they
  // move in by its width (index.css, backtotop.tsx, environment.tsx). The
  // width is set as the panel animates, so they glide with its edge.
  const followWidth = (latest: { width?: unknown }) => {
    const px = parseFloat(String(latest.width));
    if (!Number.isNaN(px)) {
      document.documentElement.style.setProperty(DOCK_WIDTH_VAR, `${px}px`);
    }
  };
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty(DOCK_WIDTH_VAR);
    },
    []
  );

  // Dragging the left edge: moving left widens the panel. The width is saved
  // once, when the drag ends.
  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    let latest = width;
    const move = (e: globalThis.PointerEvent) => {
      latest = clampWidth(width + (startX - e.clientX));
      setWidth(latest);
    };
    // The panel follows the pointer directly; easing would make it lag.
    setDragging(true);
    const stop = () => {
      setDragging(false);
      safeStorage.set(WIDTH_KEY, String(latest));
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const resizeByKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowLeft" ? 20 : event.key === "ArrowRight" ? -20 : 0;
    if (!step) return;
    event.preventDefault();
    const next = clampWidth(width + step);
    setWidth(next);
    safeStorage.set(WIDTH_KEY, String(next));
  };

  return (
    // Widens from nothing, pushing the page across as the shadcn sidebar does,
    // and narrows back on close (AnimatePresence in the admin page). The
    // contents keep their full width meanwhile, so the chat never squashes.
    <m.aside
      aria-label={t("assistant.title", "Mapper Assistant")}
      className="sticky top-0 flex h-dvh shrink-0 overflow-hidden border-l bg-background"
      initial={{ width: 0 }}
      animate={{ width }}
      exit={{ width: 0 }}
      transition={reduceMotion || dragging ? { duration: 0 } : panelTransition}
      onUpdate={followWidth}
      // Escape closes the panel, as it would a dialog, unless something
      // inside it (a menu or tooltip) used the key first.
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) onClose();
      }}
    >
      <m.div
        className="flex h-full shrink-0"
        style={{ width }}
        variants={panelContent}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        exit="hidden"
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("assistant.resizePanel", "Resize the assistant")}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={resizeByKey}
          className="w-1.5 shrink-0 cursor-col-resize transition-colors hover:bg-border focus-visible:bg-ring focus-visible:outline-none"
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col py-4 pr-4 pl-2.5">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <AssistantChat {...chat} docked onClose={onClose} />
          </Suspense>
        </div>
      </m.div>
    </m.aside>
  );
};

export default AssistantDock;
