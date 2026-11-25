import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  ChevronRight,
  Map as MapIcon,
  Pin,
  UserRound,
  Users
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { duration, fadeIn, fadeSlideUp, listItemPresence } from "@/lib/motion";
import ExpiryBadge from "../navigation/expirybadge";
import { LINK_TYPES } from "../../utils/constants";
import { resolveLocalized } from "../../utils/resolveLocalized";
import type { MyLink } from "../../hooks/useMyLinks";

const fadeOut = { opacity: 0, transition: { duration: duration.fast } };

// The shape of a map card, so the real ones land where the eye already is.
const CardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border bg-card">
    <div className="flex items-start gap-3 p-4">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      </div>
    </div>
    <div className="border-t bg-muted/30 px-4 py-2.5">
      <Skeleton className="h-4 w-28" />
    </div>
  </div>
);

interface MyLinksProps {
  links: MyLink[];
  isLoading: boolean;
  hasFailed: boolean;
  isStale?: boolean;
  updatedAt?: Date | null;
  onRefresh: () => void;
  // Called as a link is followed, for a container that has to close first.
  onOpen?: () => void;
}

const MyLinks = ({
  links,
  isLoading,
  hasFailed,
  isStale = false,
  updatedAt = null,
  onRefresh,
  onOpen
}: MyLinksProps) => {
  const { t, i18n } = useTranslation();

  const view = isLoading
    ? "loading"
    : hasFailed
      ? "failed"
      : links.length === 0
        ? "empty"
        : "list";

  // Naming the congregation on every card is noise unless the links span more
  // than one.
  const showCongregation =
    new Set(links.map((link) => link.congregation_name)).size > 1;
  // Likewise who assigned them, when one person assigned them all.
  const showAssigner = new Set(links.map((link) => link.assigner)).size > 1;

  const sections = [
    {
      key: LINK_TYPES.ASSIGNMENT,
      title: t("myLinks.assigned", "Assigned"),
      links: links.filter((link) => link.type !== LINK_TYPES.PERSONAL)
    },
    {
      key: LINK_TYPES.PERSONAL,
      title: t("myLinks.personal", "Personal territory"),
      links: links.filter((link) => link.type === LINK_TYPES.PERSONAL)
    }
  ].filter((section) => section.links.length > 0);

  // One state hands over to the next in place: the first map to arrive takes
  // over from "No maps right now" instead of the page jumping to it.
  return (
    <AnimatePresence mode="popLayout">
      {view === "loading" && (
        <m.div
          key="loading"
          initial={false}
          exit={fadeOut}
          className="space-y-3"
          role="status"
          aria-label={t("common.loading", "Loading...")}
        >
          <CardSkeleton />
          <CardSkeleton />
        </m.div>
      )}
      {view === "failed" && (
        <m.div
          key="failed"
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          exit={fadeOut}
          className="flex flex-col items-center gap-3"
        >
          <Alert variant="warning">
            <AlertDescription>
              {t("myLinks.loadFailed", "Your maps could not be loaded.")}
            </AlertDescription>
          </Alert>
          <Button variant="outline" type="button" onClick={onRefresh}>
            {t("myLinks.refresh", "Check again")}
          </Button>
        </m.div>
      )}
      {view === "empty" && (
        <m.div
          key="empty"
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          exit={fadeOut}
        >
          <Empty className="p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {t("myLinks.emptyTitle", "No maps right now")}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  "myLinks.emptyMessage",
                  "When your conductor assigns you a map, it appears here by itself."
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </m.div>
      )}
      {view === "list" && (
        <m.div key="list" exit={fadeOut} className="space-y-3">
          <m.p
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="text-sm text-muted-foreground"
          >
            {t("myLinks.description", "Tap a map to start working.")}
          </m.p>
          <div className="space-y-5">
            {isStale && (
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>
                  {updatedAt
                    ? t(
                        "myLinks.stale",
                        "Couldn't refresh. Showing your maps from {{time}}.",
                        {
                          time: updatedAt.toLocaleTimeString(i18n.language, {
                            hour: "numeric",
                            minute: "2-digit"
                          })
                        }
                      )
                    : t("myLinks.loadFailed", "Your maps could not be loaded.")}
                </span>
                <Button
                  variant="link"
                  type="button"
                  className="h-auto p-0"
                  onClick={onRefresh}
                >
                  {t("myLinks.refresh", "Check again")}
                </Button>
              </p>
            )}
            {sections.map((section) => (
              <section key={section.key} className="space-y-2">
                {sections.length > 1 && (
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </h2>
                )}
                <ItemGroup className="gap-3">
                  {/* Links arrive and leave while the page is open, so each card
                    animates itself in and out instead of relying on the mount. */}
                  <AnimatePresence>
                    {section.links.map((link, index) => {
                      const title = resolveLocalized(
                        link.map_description,
                        i18n.language
                      );
                      const details = [
                        // Many maps are named with their territory's code already.
                        !title.includes(link.territory) && link.territory,
                        showCongregation && link.congregation_name,
                        showAssigner &&
                          link.assigner &&
                          t("myLinks.from", "Assigned by {{name}}", {
                            name: link.assigner
                          })
                      ].filter(Boolean);
                      // What is left to do on the map, in the map page's own
                      // words. Nothing is said of a map not yet counted.
                      const counted = (link.total ?? 0) > 0;
                      const notDone = link.not_done ?? 0;
                      const notHome = link.not_home ?? 0;
                      const left = [
                        notDone > 0 &&
                          t("myLinks.notDone", "{{count}} not done", {
                            count: notDone
                          }),
                        notHome > 0 &&
                          t("myLinks.notHome", "{{count}} not home", {
                            count: notHome
                          })
                      ].filter(Boolean);
                      return (
                        <m.div
                          key={link.id}
                          role="listitem"
                          variants={listItemPresence}
                          custom={index}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                        >
                          <Item
                            variant="outline"
                            size="sm"
                            className="flex-col items-stretch gap-0 overflow-hidden rounded-xl bg-card p-0 text-foreground no-underline active:scale-[0.99] motion-reduce:transition-none [a]:transition-[background-color,transform] [a]:hover:bg-accent/30"
                            render={
                              <Link href={`/map/${link.id}`} onClick={onOpen} />
                            }
                          >
                            <div className="flex items-start gap-3 p-4">
                              <ItemMedia
                                variant="icon"
                                className="size-10 rounded-lg bg-primary/10 text-primary"
                              >
                                {section.key === LINK_TYPES.PERSONAL ? (
                                  <UserRound aria-hidden="true" />
                                ) : (
                                  <MapIcon aria-hidden="true" />
                                )}
                              </ItemMedia>
                              <ItemContent className="min-w-0 gap-3">
                                <div className="space-y-0.5">
                                  <ItemTitle className="line-clamp-2 text-base leading-snug font-semibold">
                                    {title}
                                  </ItemTitle>
                                  {details.length > 0 && (
                                    <ItemDescription className="line-clamp-1 text-sm">
                                      {details.join(" · ")}
                                    </ItemDescription>
                                  )}
                                  {link.partners.length > 0 && (
                                    <ItemDescription className="flex items-center gap-1.5 text-sm">
                                      <Users
                                        className="size-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span className="min-w-0 truncate">
                                        {t("myLinks.with", "With {{names}}", {
                                          names: link.partners.join(", ")
                                        })}
                                      </span>
                                    </ItemDescription>
                                  )}
                                  {(link.pinned ?? 0) > 0 && (
                                    <p className="flex items-center gap-1.5 pt-0.5 text-sm font-medium text-info">
                                      <Pin
                                        className="size-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      {t(
                                        "myLinks.instructions",
                                        "Read the instructions first"
                                      )}
                                    </p>
                                  )}
                                </div>
                                {counted && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-3">
                                      <Progress
                                        value={link.progress ?? 0}
                                        className="h-1.5 flex-1"
                                        aria-label={t(
                                          "territory.completed",
                                          "Completed"
                                        )}
                                      />
                                      <span className="shrink-0 text-sm font-medium tabular-nums">
                                        {link.progress ?? 0}%
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {left.length > 0
                                        ? left.join(" · ")
                                        : t("myLinks.allDone", "All done")}
                                    </p>
                                  </div>
                                )}
                              </ItemContent>
                              <ItemActions className="shrink-0 self-center">
                                <ChevronRight
                                  className="size-4 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              </ItemActions>
                            </div>
                            <ItemFooter className="border-t bg-muted/30 px-4 py-2.5">
                              <ExpiryBadge
                                plain
                                endtime={new Date(link.expiry_date).getTime()}
                                onExpired={onRefresh}
                              />
                            </ItemFooter>
                          </Item>
                        </m.div>
                      );
                    })}
                  </AnimatePresence>
                </ItemGroup>
              </section>
            ))}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default MyLinks;
