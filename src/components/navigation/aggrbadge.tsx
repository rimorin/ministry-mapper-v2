import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { aggregateBadgeProp } from "../../utils/interface";
import useAnimatedCounter from "../../hooks/useAnimatedCounter";

const AggregationBadge = ({
  aggregate = 0,
  width,
  className,
  size = "md"
}: aggregateBadgeProp) => {
  const displayed = useAnimatedCounter(aggregate);
  const urgency = displayed > 90 ? "high" : displayed > 70 ? "medium" : "low";
  const defaultWidth =
    size === "sm" ? "2.5rem" : size === "lg" ? "3.5rem" : "3rem";

  return (
    <span className={cn("mx-1 shrink-0", className)}>
      <Badge
        className={cn(
          "rounded-full tabular-nums",
          size === "sm" && "h-4 text-[10px]",
          size === "md" && "h-5 text-xs",
          size === "lg" && "h-6 text-sm",
          urgency === "high" && "bg-destructive text-white",
          urgency === "medium" && "bg-yellow-500 text-black dark:text-black",
          urgency === "low" && "bg-green-600 text-white"
        )}
        style={{ width: width ?? defaultWidth }}
      >
        {displayed}%
      </Badge>
    </span>
  );
};

export default AggregationBadge;
