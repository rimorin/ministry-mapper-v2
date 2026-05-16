import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PendingBadgeProps {
  count: number;
  className?: string;
}

export default function PendingBadge({ count, className }: PendingBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-[5px] text-sm tabular-nums text-[var(--mm-warning)] border-transparent [animation:status-pulse_2s_ease-in-out_infinite] motion-reduce:[animation:none]",
        className
      )}
      title={`${count} pending sync${count > 1 ? "s" : ""}`}
    >
      <span aria-hidden="true">📤</span>
      {count}
    </Badge>
  );
}
