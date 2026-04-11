import { FC, lazy } from "react";
import { Button, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import NiceModal from "@ebay/nice-modal-react";
import { useReleaseNotesContext } from "../middlewares/releasenotescontext";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const ReleaseNotesModal = lazy(() => import("../modal/releasenotes"));

interface ReleaseHistoryBtnProps {
  className?: string;
}

const ReleaseHistoryBtn: FC<ReleaseHistoryBtnProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { allReleases, isLoading } = useReleaseNotesContext();

  const handleClick = () => {
    NiceModal.show(ReleaseNotesModal, { releases: allReleases });
  };

  return (
    <Button
      variant="outline-primary"
      size="sm"
      onClick={handleClick}
      disabled={isLoading || allReleases.length === 0}
      className={className}
      aria-label={t("releaseNotes.history", "Release History")}
      title={t("releaseNotes.history", "Release History")}
    >
      <Image
        src={getAssetUrl("changelog.svg")}
        alt=""
        aria-hidden="true"
        style={{ width: "1.25em", height: "1.25em" }}
      />
    </Button>
  );
};

export default ReleaseHistoryBtn;
