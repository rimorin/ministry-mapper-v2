import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import PendingBadge from "../../../components/navigation/pendingbadge";

interface AdminNavbarProps {
  congregationName: string;
  territoryName?: string;
  onSwitchTerritory?: () => void;
  pendingCount?: number;
}

export default function AdminNavbar({
  congregationName,
  territoryName,
  onSwitchTerritory,
  pendingCount = 0
}: AdminNavbarProps) {
  return (
    <header className="admin-navbar sticky top-0 z-50 flex items-center gap-2 border-b bg-background px-3 py-2">
      <SidebarTrigger variant="outline" size="icon-lg" />
      {!congregationName ? (
        <Spinner aria-hidden="true" className="text-primary" />
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
