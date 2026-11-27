import { useState, useSyncExternalStore } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemDescription,
  ItemFooter,
  ItemTitle
} from "@/components/ui/item";
import { listItemPresence } from "@/lib/motion";
import { BRAND_URL } from "../../utils/constants";
import {
  canOfferInstall,
  isAppleMobile,
  isInstalled,
  isTouchScreen,
  offerInstall,
  subscribeInstall
} from "../../utils/install";

const DISMISSED_KEY = "mm-install-dismissed";

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

// Safari's own buttons, drawn inside the sentence that names them.
const glyphClass = "mx-0.5 inline size-4 -translate-y-px text-info";
const stepParts = {
  share: <Share className={glyphClass} aria-hidden="true" />,
  add: <SquarePlus className={glyphClass} aria-hidden="true" />,
  b: <strong className="font-medium" />
};

const StepNumber = ({ n }: { n: number }) => (
  <span
    className="flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-[11px] font-medium text-muted-foreground tabular-nums"
    aria-hidden="true"
  >
    {n}
  </span>
);

// Shown once on a phone that has not added the app yet: without the link a
// conductor used to send, the Home Screen is how the maps are found again.
const InstallCard = () => {
  const { t } = useTranslation();
  const canOffer = useSyncExternalStore(
    subscribeInstall,
    canOfferInstall,
    () => false
  );
  const [dismissed, setDismissed] = useState(wasDismissed);

  const way =
    dismissed || isInstalled() || !isTouchScreen()
      ? null
      : canOffer
        ? "offer"
        : isAppleMobile()
          ? "steps"
          : null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage is blocked: the card comes back next time.
    }
  };

  const install = async () => {
    if (await offerInstall()) dismiss();
  };

  // Leaves the way the map cards do, rather than vanishing under the thumb.
  return (
    <AnimatePresence>
      {way && (
        <m.div
          key="install"
          variants={listItemPresence}
          custom={0}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <Item
            variant="outline"
            className="flex-col items-stretch gap-0 overflow-hidden rounded-xl bg-card p-0"
          >
            <div className="flex items-start gap-3 p-4">
              <img
                src={`${BRAND_URL}/apple-touch-icon-180x180.png`}
                alt=""
                className="size-10 shrink-0 rounded-[10px] shadow-sm ring-1 ring-foreground/5"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <ItemTitle className="text-base leading-snug font-semibold">
                  {t("install.title", "Keep your maps one tap away")}
                </ItemTitle>
                <ItemDescription className="text-sm text-balance">
                  {t(
                    "install.body",
                    "Add Ministry Mapper to your Home Screen."
                  )}
                </ItemDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="-me-1.5 -mt-1 shrink-0 text-muted-foreground"
                aria-label={t("install.notNow", "Not now")}
                onClick={dismiss}
              >
                <X />
              </Button>
            </div>
            <ItemFooter className="flex-col items-stretch gap-0 border-t bg-muted/30 px-4 py-3">
              {way === "offer" ? (
                <Button type="button" className="w-full" onClick={install}>
                  {t("install.add", "Add to Home Screen")}
                </Button>
              ) : (
                <>
                  <ol className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-3">
                      <StepNumber n={1} />
                      <span>
                        <Trans
                          t={t}
                          i18nKey="install.stepShare"
                          defaults="Tap <share/> <b>Share</b>"
                          components={stepParts}
                        />
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <StepNumber n={2} />
                      <span>
                        <Trans
                          t={t}
                          i18nKey="install.stepAdd"
                          defaults="Choose <add/> <b>Add to Home Screen</b>"
                          components={stepParts}
                        />
                      </span>
                    </li>
                  </ol>
                  <p className="mt-2.5 ps-8 text-xs text-muted-foreground">
                    {t(
                      "install.stepShareHint",
                      "Don't see Share? Tap ⋯ first."
                    )}
                  </p>
                </>
              )}
            </ItemFooter>
          </Item>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default InstallCard;
