interface PendingBadgeProps {
  count: number;
  className?: string;
}

export default function PendingBadge({ count, className }: PendingBadgeProps) {
  return (
    <span
      className={["pending-sync-badge", className].filter(Boolean).join(" ")}
      title={`${count} pending sync${count > 1 ? "s" : ""}`}
    >
      <span aria-hidden="true">📤</span>
      {count}
    </span>
  );
}
