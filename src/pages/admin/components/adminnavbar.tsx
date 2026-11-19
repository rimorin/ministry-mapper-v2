import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import PendingBadge from "../../../components/navigation/pendingbadge";

interface AdminNavbarProps {
  congregationName: string;
  territoryName?: string;
  // Names a view that is not a territory, in place of the territory switcher.
  title?: string;
  onSwitchTerritory?: () => void;
  pendingCount?: number;
  // The account holds map links: marks the sidebar trigger, since the count
  // itself is out of sight while the sidebar is closed.
  hasLinks?: boolean;
}

export default function AdminNavbar({
  congregationName,
  territoryName,
  title,
  onSwitchTerritory,
  pendingCount = 0,
  hasLinks = false
}: AdminNavbarProps) {
  return (
    <header className="admin-navbar sticky top-0 z-50 flex items-center gap-2 border-b bg-background px-3 py-2">
      <span className="relative shrink-0 md:contents">
        <SidebarTrigger variant="outline" size="icon-lg" />
        {hasLinks && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background md:hidden"
          />
        )}
      </span>
      {!congregationName ? (
        <Spinner aria-hidden="true" className="text-primary" />
      ) : title ? (
        <h1 className="min-w-0 truncate px-2 text-base font-semibold">
          {title}
        </h1>
      ) : territoryName && onSwitchTerritory ? (
        <Button
          variant="ghost"
          size="lg"
          onClick={onSwitchTerritory}
          aria-haspopup="dialog"
          className="min-w-0 px-2 text-base font-semibold"
        >
          <span className="truncate">{territoryName}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      ) : (
        <span className="truncate text-sm font-semibold sm:hidden">
          {congregationName}
        </span>
      )}
      {pendingCount > 0 && (
        <PendingBadge count={pendingCount} className="ml-auto flex" />
      )}
    </header>
  );
}
