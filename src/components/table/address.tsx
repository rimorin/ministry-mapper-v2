import { Check, Ban, X, StickyNote } from "lucide-react";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import { duration, springPop } from "@/lib/motion";
import { STATUS_CODES } from "../../utils/constants";
import { type unitProps } from "../../utils/interface";
import NotHomeIcon from "./nothome";

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case STATUS_CODES.DONE:
      return <Check className="size-6 text-status-done stroke-[3]" />;
    case STATUS_CODES.DO_NOT_CALL:
      return <Ban className="size-5 text-status-dnc stroke-[3]" />;
    default:
      return null;
  }
};

const statusMotion = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.4,
    transition: { duration: duration.fast, ease: "easeIn" }
  },
  transition: springPop
} as const;

const MAX_VISIBLE_TYPES = 2;

const AddressStatus = (props: unitProps) => {
  const {
    type: householdType,
    note,
    status: currentStatus,
    nhcount,
    defaultOption = ""
  } = props;

  const filtered = householdType?.filter((t) => t.id !== defaultOption) ?? [];
  const visible = filtered.slice(0, MAX_VISIBLE_TYPES);
  const overflow = filtered.length - MAX_VISIBLE_TYPES;
  const hasSecondary = filtered.length > 0 || note;

  const isNotHome = currentStatus === STATUS_CODES.NOT_HOME;
  const isInvalid = currentStatus === STATUS_CODES.INVALID;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isInvalid ? (
        <m.div
          key="invalid"
          className="flex items-center justify-center w-full h-full"
          {...statusMotion}
        >
          <X className="size-5 text-status-invalid stroke-[3]" />
        </m.div>
      ) : (
        <m.div
          key={currentStatus}
          className="flex flex-col items-center justify-center gap-0.5 w-full h-full py-1"
          {...statusMotion}
        >
          <div className="flex items-center justify-center">
            {isNotHome ? (
              <NotHomeIcon nhcount={nhcount} iconClassName="size-5" />
            ) : (
              <StatusIcon status={currentStatus} />
            )}
          </div>
          {hasSecondary && (
            <div className="flex items-center justify-center gap-0.5 flex-wrap max-w-full px-0.5">
              {note && (
                <StickyNote
                  className="size-4 text-warning shrink-0"
                  aria-label={note}
                />
              )}
              {visible.map((t) => (
                <span
                  key={t.id}
                  className="text-sm leading-none bg-foreground/15 border border-foreground/20 text-foreground font-bold px-1.5 py-0.5 rounded min-w-5 text-center"
                >
                  {t.code}
                </span>
              ))}
              {overflow > 0 && (
                <span className="text-sm leading-none text-foreground font-bold">
                  +{overflow}
                </span>
              )}
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default AddressStatus;

// Info blue, not orange: orange already means "not home" on the same cell.
export const PendingSyncDot = () => (
  <span
    aria-label="pending smart sync"
    className="pointer-events-none absolute top-[3px] right-[3px] size-[7px] rounded-full bg-info"
  />
);
