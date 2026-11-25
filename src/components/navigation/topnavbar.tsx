import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AppLogo from "../common/app-logo";
import ExpiryBadge from "./expirybadge";
import PendingBadge from "./pendingbadge";

interface TopNavbarProps {
  title: string;
  tokenEndTime?: number;
  pendingCount?: number;
  onTokenExpired?: () => void;
  // A signed-in account reached this map from its links, so it gets a way back.
  showMyLinks?: boolean;
}

const TopNavbar = ({
  title,
  tokenEndTime = 0,
  pendingCount = 0,
  onTokenExpired,
  showMyLinks = false
}: TopNavbarProps) => {
  const { t } = useTranslation();
  return (
    <nav className="shrink-0 border-b bg-background">
      <div className="flex min-h-14 items-center gap-3 px-4">
        {/* The way back takes the logo's place: both together crowd the title
            off a phone screen. */}
        {showMyLinks ? (
          <Link
            href="/"
            replace
            aria-label={t("myLinks.title", "My Maps")}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "shrink-0"
            )}
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <AppLogo className="size-7" />
        )}
        <span className="font-bold fluid-text min-w-0 flex-1 line-clamp-2">
          {title}
        </span>
        {pendingCount > 0 && (
          <div className="shrink-0">
            <PendingBadge count={pendingCount} />
          </div>
        )}
        {tokenEndTime > 0 && (
          <div className="shrink-0">
            <ExpiryBadge endtime={tokenEndTime} onExpired={onTokenExpired} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
