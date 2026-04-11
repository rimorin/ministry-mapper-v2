import { useEffect, useRef } from "react";
import NiceModal from "@ebay/nice-modal-react";
import { useReleaseNotesContext } from "../middlewares/releasenotescontext";
import ReleaseNotesModal from "../modal/releasenotes";

const MAX_POPUP_RELEASES = 3;

export function ReleaseNotifier() {
  const { hasNewReleases, newReleases, isLoading, markAsSeen } =
    useReleaseNotesContext();
  const hasOpened = useRef(false);

  useEffect(() => {
    if (!isLoading && hasNewReleases && !hasOpened.current) {
      hasOpened.current = true;
      NiceModal.show(ReleaseNotesModal, {
        releases: newReleases.slice(0, MAX_POPUP_RELEASES),
        onSeen: markAsSeen
      });
    }
  }, [isLoading, hasNewReleases, newReleases, markAsSeen]);

  return null;
}
