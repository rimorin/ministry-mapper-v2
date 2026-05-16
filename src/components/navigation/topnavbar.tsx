import { getAssetUrl } from "../../utils/helpers/assetpath";
import ExpiryBadge from "./expirybadge";
import PendingBadge from "./pendingbadge";

interface TopNavbarProps {
  title: string;
  tokenEndTime?: number;
  pendingCount?: number;
  onTokenExpired?: () => void;
}

const TopNavbar = ({
  title,
  tokenEndTime = 0,
  pendingCount = 0,
  onTokenExpired
}: TopNavbarProps) => {
  return (
    <nav className="shrink-0 border-b bg-background">
      <div className="flex min-h-14 items-center gap-3 px-4">
        <img
          src={getAssetUrl("favicon-32x32.png")}
          alt=""
          width="28"
          height="28"
          className="shrink-0"
        />
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
