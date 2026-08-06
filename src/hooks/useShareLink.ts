import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isAbortError } from "../utils/pocketbase";
import buildMapLink from "../utils/helpers/maplink";
import useNotification from "./useNotification";

export type ShareLinkResult = "shared" | "copied" | "cancelled";

interface ShareLinkOptions {
  linkId: string;
  message: string;
}

const useShareLink = () => {
  const { t } = useTranslation();
  const { notifySuccess } = useNotification();
  const [isSharing, setIsSharing] = useState(false);
  const canNativeShare = !!navigator.share;
  const shareButtonLabel = canNativeShare
    ? t("generatedMap.share", "Share")
    : t("links.copyLink", "Copy link");

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    notifySuccess(t("links.linkCopied", "Link copied"));
  };

  // Must be invoked directly from a click/submit handler: navigator.share and
  // clipboard.writeText only work inside the gesture's transient activation
  // window, so nothing may be awaited before they run.
  const shareLink = async ({
    linkId,
    message
  }: ShareLinkOptions): Promise<ShareLinkResult> => {
    const text = `${message}\n${buildMapLink(linkId)}`;
    if (!canNativeShare) {
      await copyText(text);
      return "copied";
    }
    setIsSharing(true);
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  return { shareLink, copyText, isSharing, shareButtonLabel };
};

export default useShareLink;
