import { FC, lazy, use } from "react";
import { useTranslation } from "react-i18next";
import NiceModal from "@ebay/nice-modal-react";
import { Button } from "@/components/ui/button";
import { useReleaseNotesContext } from "../middlewares/releasenotescontext";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { ThemeContext } from "../utils/context";

const ReleaseNotesModal = lazy(() => import("../modal/releasenotes"));

interface ReleaseHistoryBtnProps {
  className?: string;
}

const ReleaseHistoryBtn: FC<ReleaseHistoryBtnProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { allReleases, isLoading } = useReleaseNotesContext();
  const { actualTheme } = use(ThemeContext);

  const handleClick = () => {
    NiceModal.show(ReleaseNotesModal, { releases: allReleases });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading || allReleases.length === 0}
      className={className}
      aria-label={t("releaseNotes.history", "Release History")}
      title={t("releaseNotes.history", "Release History")}
    >
      <img
        src={getAssetUrl("changelog.svg")}
        alt=""
        aria-hidden="true"
        style={{
          width: "1.25em",
          height: "1.25em",
          filter: actualTheme === "dark" ? "brightness(0) invert(1)" : "none"
        }}
      />
    </Button>
  );
};

export default ReleaseHistoryBtn;
