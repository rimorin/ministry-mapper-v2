import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as m from "motion/react-m";
import { staggerContainer, fadeSlideUp } from "@/lib/motion";
import type { ReleaseEntry } from "../../hooks/useReleaseNotes";
import { resolveLocalized } from "../../utils/resolveLocalized";

interface ReleaseNotesModalProps {
  releases: ReleaseEntry[];
  onSeen?: () => void;
}

const ITEM_CONFIG = {
  new: {
    colorClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    labelKey: "releaseNotes.new"
  },
  fix: {
    colorClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    labelKey: "releaseNotes.fix"
  },
  improved: {
    colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    labelKey: "releaseNotes.improved"
  },
  announcement: {
    colorClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    labelKey: "releaseNotes.announcement"
  }
} as const;

function renderDescription(text: string) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    nodes.push(
      <ul
        key={key++}
        className="mb-0 mt-2 pl-3 fluid-small text-muted-foreground"
      >
        {bullets.map((b, i) => (
          <li key={i} className="mb-1">
            {b.slice(2)}
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const line of lines) {
    if (line === "") {
      flushBullets();
    } else if (line.startsWith("- ")) {
      bullets.push(line);
    } else if (line.endsWith(":") || line.endsWith("：")) {
      flushBullets();
      nodes.push(
        <p
          key={key++}
          className="mb-0 mt-3 fluid-small font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {line.slice(0, -1)}
        </p>
      );
    } else {
      flushBullets();
      nodes.push(
        <p key={key++} className="mb-0 mt-2 fluid-small text-muted-foreground">
          {line}
        </p>
      );
    }
  }
  flushBullets();
  return nodes;
}

const ReleaseNotesModal = NiceModal.create(
  ({ releases, onSeen }: ReleaseNotesModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      staticBackdrop: true
    });
    const { t, i18n } = useTranslation();

    const resolve = (value: Parameters<typeof resolveLocalized>[0]) =>
      resolveLocalized(value, i18n.language);

    const formatDate = (iso: string) => {
      const [year, month, day] = iso.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric"
      };
      try {
        return date.toLocaleDateString(i18n.language, options);
      } catch {
        return date.toLocaleDateString("en", options);
      }
    };

    const handleDismiss = () => {
      onSeen?.();
      modal.hide();
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          aria-labelledby="release-notes-title"
          showCloseButton={false}
          className={cn(contentProps.className, "sm:max-w-2xl")}
        >
          <DialogHeader>
            <DialogTitle
              id="release-notes-title"
              className="fluid-text font-bold"
            >
              {t("releaseNotes.title", "What's New")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80dvh]" withFade>
            <m.div
              className="flex flex-col gap-4 p-4"
              variants={staggerContainer(0.07, 0.15)}
              initial="hidden"
              animate="show"
            >
              {releases.map((release, idx) => {
                const notice = resolve(release.notice);
                return (
                  <m.div key={release.id} variants={fadeSlideUp}>
                    <Card className="overflow-hidden gap-0 py-0">
                      <CardHeader className="flex items-center gap-2 py-3 px-4">
                        <strong className="fluid-small">
                          {formatDate(release.id.substring(0, 10))}
                        </strong>
                        {idx === 0 && (
                          <Badge
                            variant="secondary"
                            className="font-normal ml-auto"
                          >
                            {t("releaseNotes.latest", "Latest")}
                          </Badge>
                        )}
                      </CardHeader>
                      {notice && (
                        <Alert variant="warning" className="rounded-none">
                          <TriangleAlert />
                          <AlertDescription>{notice}</AlertDescription>
                        </Alert>
                      )}
                      {release.screenshot && (
                        <img
                          src={
                            release.screenshot.startsWith("http")
                              ? release.screenshot
                              : `/${release.screenshot}`
                          }
                          alt={`release screenshot ${release.id}`}
                          className="w-full block max-h-[300px] object-contain"
                        />
                      )}
                      <CardContent className="px-0">
                        <m.ul
                          className="m-0 list-none divide-y p-0 border-t"
                          variants={staggerContainer(0.05, 0.05)}
                          initial="hidden"
                          animate="show"
                        >
                          {release.items.map((item, i) => {
                            const config = ITEM_CONFIG[item.type];
                            const text = resolve(item.text);
                            const description = resolve(item.description);
                            return (
                              <m.li
                                key={`${item.type}-${i}`}
                                className="flex items-start gap-3 py-3 px-4"
                                variants={fadeSlideUp}
                              >
                                <span
                                  className={cn(
                                    "rounded fluid-button flex-shrink-0 text-center",
                                    config.colorClass
                                  )}
                                  style={{
                                    minWidth: "4rem",
                                    marginTop: "0.15rem"
                                  }}
                                >
                                  {t(config.labelKey)}
                                </span>
                                <span className="fluid-text leading-[1.4] font-semibold">
                                  {text}
                                  {description &&
                                    renderDescription(description)}
                                </span>
                              </m.li>
                            );
                          })}
                        </m.ul>
                      </CardContent>
                    </Card>
                  </m.div>
                );
              })}
            </m.div>
          </ScrollArea>
          <DialogFooter>
            <Button autoFocus onClick={handleDismiss}>
              {t("releaseNotes.dismiss", "Dismiss")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default ReleaseNotesModal;
