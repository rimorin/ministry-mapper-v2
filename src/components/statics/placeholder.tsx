import { FC } from "react";
import { Policy } from "../../utils/policies";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as m from "motion/react-m";
import { fadeIn, staggerContainer } from "@/lib/motion";

interface MapPlaceholderProps {
  policy: Policy | undefined;
  rows?: number;
  columns?: number;
}

const widthClasses = ["w-1/2", "w-2/3", "w-7/12", "w-5/12", "w-3/4", "w-1/3"];

const MapPlaceholder: FC<MapPlaceholderProps> = ({
  policy,
  rows = 15,
  columns = 4
}) => {
  const isAdmin = policy?.isFromAdmin() ?? true;
  const containerClass = isAdmin
    ? "map-body-admin !overflow-hidden"
    : "h-full overflow-hidden";

  return (
    <m.div
      className={cn(containerClass, "map-placeholder-content bg-background")}
      variants={fadeIn}
      initial="hidden"
      animate="show"
    >
      <table className="w-full border-collapse mb-0 border border-border opacity-70">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th
                key={i}
                className="py-2 px-3 border border-border bg-muted/50 text-left"
              >
                <Skeleton className="h-4 w-3/5" />
              </th>
            ))}
          </tr>
        </thead>
        <m.tbody variants={staggerContainer(0.04)}>
          {Array.from({ length: rows }, (_, i) => (
            <m.tr key={i} variants={fadeIn}>
              {Array.from({ length: columns }, (_, j) => (
                <td key={j} className="py-2 px-3 border border-border">
                  <Skeleton
                    className={`h-4 ${widthClasses[i % widthClasses.length]}`}
                  />
                </td>
              ))}
            </m.tr>
          ))}
        </m.tbody>
      </table>
    </m.div>
  );
};

export default MapPlaceholder;
