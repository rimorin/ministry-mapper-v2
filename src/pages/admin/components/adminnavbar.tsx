import { Spinner } from "@/components/ui/spinner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import PendingBadge from "../../../components/navigation/pendingbadge";

interface AdminNavbarProps {
  congregationName: string;
  pendingCount?: number;
}

export default function AdminNavbar({
  congregationName,
  pendingCount = 0
}: AdminNavbarProps) {
  return (
    <header className="admin-navbar sticky top-0 z-50 flex items-center gap-2 border-b bg-background px-3 py-2">
      <SidebarTrigger />
      {congregationName ? (
        <span className="truncate text-sm font-semibold sm:hidden">
          {congregationName}
        </span>
      ) : (
        <Spinner aria-hidden="true" className="text-primary" />
      )}
      {pendingCount > 0 && (
        <PendingBadge count={pendingCount} className="ml-auto flex" />
      )}
    </header>
  );
}
