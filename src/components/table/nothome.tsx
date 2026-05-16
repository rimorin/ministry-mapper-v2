import { Mail } from "lucide-react";
import { type nothomeProps } from "../../utils/interface";
import { cn } from "@/lib/utils";

interface NotHomeIconProps extends nothomeProps {
  iconClassName?: string;
  mapMode?: boolean;
}

const NotHomeIcon = ({
  nhcount,
  iconClassName = "size-4",
  mapMode = false
}: NotHomeIconProps) => {
  return (
    <span className="relative inline-flex items-center justify-center">
      <Mail className={cn(iconClassName, "text-amber-500")} />
      {nhcount && (
        <span
          className={cn(
            "absolute -right-1.5 -top-1.5 z-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[10px] font-bold leading-none",
            mapMode
              ? "bg-zinc-900 text-white border border-white shadow-sm"
              : "bg-primary text-primary-foreground border border-white shadow-sm"
          )}
        >
          {nhcount}
        </span>
      )}
    </span>
  );
};

export default NotHomeIcon;
