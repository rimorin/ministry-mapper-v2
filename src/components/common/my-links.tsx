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
  ItemGroup,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeSlideUp, listItemPresence } from "@/lib/motion";
import ExpiryBadge from "../navigation/expirybadge";
import { LINK_TYPES } from "../../utils/constants";
import { resolveLocalized } from "../../utils/resolveLocalized";
import type { MyLink } from "../../hooks/useMyLinks";

interface MyLinksProps {
  links: MyLink[];
  isLoading: boolean;
  hasFailed: boolean;
  onRefresh: () => void;
  // Called as a link is followed, for a container that has to close first.
  onOpen?: () => void;
}

const MyLinks = ({
  links,
  isLoading,
  hasFailed,
  onRefresh,
  onOpen
}: MyLinksProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <div
        className="space-y-2"
        role="status"
        aria-label={t("common.loading", "Loading...")}
      >
        <Skeleton className="h-15 rounded-lg" />
        <Skeleton className="h-15 rounded-lg" />
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Alert variant="warning">
          <AlertDescription>
            {t("myLinks.loadFailed", "Your maps could not be loaded.")}
          </AlertDescription>
        </Alert>
        <Button variant="outline" type="button" onClick={onRefresh}>
          {t("myLinks.refresh", "Check again")}
        </Button>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <m.div variants={fadeSlideUp} initial="hidden" animate="show">
        <Empty className="p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {t("myLinks.emptyTitle", "No maps right now")}
            </EmptyTitle>
            <EmptyDescription>
              {t("myLinks.emptyMessage", "Maps given to you show up here.")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </m.div>
    );
  }

  // Naming the congregation on every card is noise unless the links span more
  // than one.
  const showCongregation =
    new Set(links.map((link) => link.congregation_name)).size > 1;

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

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.key} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <ItemGroup className="gap-2">
            {/* Links arrive and leave while the page is open, so each card
                animates itself in and out instead of relying on the mount. */}
            <AnimatePresence>
              {section.links.map((link, index) => {
                const details = [
                  link.territory,
                  showCongregation && link.congregation_name,
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
                      className="flex-nowrap rounded-lg bg-card text-foreground no-underline active:scale-[0.99] motion-reduce:transition-none [a]:transition-[background-color,transform] [a]:hover:bg-accent/30"
                      render={
                        <Link href={`/map/${link.id}`} onClick={onOpen} />
                      }
                    >
                      <ItemMedia
                        variant="icon"
                        className="size-9 rounded-md bg-primary/10 text-primary"
                      >
                        {section.key === LINK_TYPES.PERSONAL ? (
                          <UserRound aria-hidden="true" />
                        ) : (
                          <MapIcon aria-hidden="true" />
                        )}
                      </ItemMedia>
                      {/* The expiry sits under the details on a phone, where
                          beside them it would squeeze the map's name, and to
                          the right from the sm breakpoint up. */}
                      <ItemContent className="min-w-0 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-3">
                        <ItemTitle className="line-clamp-2 font-semibold">
                          {resolveLocalized(
                            link.map_description,
                            i18n.language
                          )}
                          {(link.pinned ?? 0) > 0 && (
                            <Pin
                              className="ml-1.5 inline size-3.5 align-[-0.125em] text-muted-foreground"
                              role="img"
                              aria-label={t(
                                "myLinks.instructions",
                                "Has instructions"
                              )}
                            />
                          )}
                        </ItemTitle>
                        {details.length > 0 && (
                          <ItemDescription className="line-clamp-1 text-sm sm:col-start-1">
                            {details.join(" · ")}
                          </ItemDescription>
                        )}
                        {link.partners.length > 0 && (
                          <ItemDescription className="flex items-center gap-1.5 text-sm sm:col-start-1">
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
                        {counted && (
                          <div className="mt-1.5 space-y-1 sm:col-start-1">
                            <Progress
                              value={link.progress ?? 0}
                              className="h-1.5"
                              aria-label={t("territory.completed", "Completed")}
                            />
                            <p className="flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
                              <span className="min-w-0 truncate">
                                {left.length > 0
                                  ? left.join(" · ")
                                  : t("myLinks.allDone", "All done")}
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {link.progress ?? 0}%
                              </span>
                            </p>
                          </div>
                        )}
                        <span className="mt-1 w-fit sm:col-start-2 sm:row-span-3 sm:row-start-1 sm:mt-0">
                          <ExpiryBadge
                            endtime={new Date(link.expiry_date).getTime()}
                            onExpired={onRefresh}
                          />
                        </span>
                      </ItemContent>
                      <ItemActions className="shrink-0">
                        <ChevronRight
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </ItemActions>
                    </Item>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </ItemGroup>
        </section>
      ))}
    </div>
  );
};

export default MyLinks;
