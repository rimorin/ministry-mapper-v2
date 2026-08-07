import { Mail } from "lucide-react";
import { type nothomeProps } from "../../utils/interface";
import { cn } from "@/lib/utils";

interface NotHomeIconProps extends nothomeProps {
  iconClassName?: string;
}

const NotHomeIcon = ({
  nhcount,
  iconClassName = "size-4"
}: NotHomeIconProps) => {
  return (
    <span className="relative inline-flex items-center justify-center">
      <Mail
        className={cn(iconClassName, "text-orange-500 dark:text-orange-400")}
      />
      {nhcount && (
        <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full text-[11px] font-bold bg-zinc-900 text-white border border-white shadow-sm">
          {nhcount}
        </span>
      )}
    </span>
  );
};

export default NotHomeIcon;
