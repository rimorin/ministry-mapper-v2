import { useTranslation } from "react-i18next";
import { Building2, MapPin, Pin, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  STATUS_CELL,
  STATUS_ORDER,
  STEADY_HOVER,
  useValueLabel
} from "./assistant-shared";

// The backend sends dates as the congregation's own wall-clock time, such as
// "2026-11-08" or "2026-11-08 14:20". They are formatted from their parts, so
// the time shown is never shifted into the reader's time zone.
const localStamp = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/;
const formatLocalStamp = (stamp: string, locale: string) => {
  const parts = localStamp.exec(stamp);
  if (!parts) return stamp;
  const [, y, m, d, hh, mm] = parts.map(Number);
  const withTime = parts[4] !== undefined;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      ...(withTime && { timeStyle: "short" })
    }).format(new Date(y, m - 1, d, withTime ? hh : 0, withTime ? mm : 0));
  } catch {
    return stamp;
  }
};

interface MapLink {
  publisher: string;
  expires: string;
}

interface AssistantMapDetailProps {
  // One row of the map_details function (tools_map_details.go).
  row: Record<string, unknown>;
  onShowHomes: () => void;
  onShowOnMap: () => void;
}

const Section = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-muted-foreground uppercase">
      {title}
    </span>
    {children}
  </div>
);

// Everything about one map, laid out as a card rather than a one-row table.
const AssistantMapDetail = ({
  row,
  onShowHomes,
  onShowOnMap
}: AssistantMapDetailProps) => {
  const { t, i18n } = useTranslation();
  const statusLabel = useValueLabel();
  const num = (field: string) => Number(row[field] ?? 0);
  const text = (field: string) => String(row[field] ?? "");
  // Every home on the map, counted toward progress or not. Answers kept from
  // before all_homes was sent have only homes.
  const allHomes = num("all_homes") || num("homes");
  const date = (stamp: string) =>
    formatLocalStamp(stamp, i18n.resolvedLanguage ?? i18n.language);
  const pinned = Array.isArray(row.pinned) ? (row.pinned as string[]) : [];
  const links = Array.isArray(row.links) ? (row.links as MapLink[]) : null;
  const building = text("type") === "multi";
  const territoryName = text("territory_name");

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
      <div className="flex flex-col">
        <span className="font-medium">{text("map")}</span>
        <span className="text-muted-foreground">
          {text("territory")}
          {territoryName && ` · ${territoryName}`}
          {" · "}
          {building
            ? t(
                "assistant.detail.buildingShape",
                "Floors {{floors}}, {{units}} units a floor",
                { floors: text("floors"), units: num("units_per_floor") }
              )
            : t("assistant.detail.housesShape", "Street of houses")}
          {" · "}
          {t("assistant.action.homes", "{{count}} homes", {
            count: allHomes
          })}
        </span>
      </div>

      <Section title={t("assistant.detail.progress", "Progress")}>
        <div className="flex items-center gap-2">
          <Progress value={num("progress")} className="flex-1" />
          <span className="tabular-nums">{num("progress")}%</span>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="flex items-center gap-1">
              <span
                className={cn("size-3 rounded-sm ring-1", STATUS_CELL[status])}
              />
              {statusLabel(status)}{" "}
              <span className="tabular-nums">
                {num(status === "do_not_call" ? "dnc" : status)}
              </span>
              {status === "not_home" && num("at_try_limit") > 0 && (
                <span className="text-muted-foreground">
                  {t("assistant.detail.atLimit", "({{count}} at the limit)", {
                    count: num("at_try_limit")
                  })}
                </span>
              )}
            </li>
          ))}
        </ul>
        {num("not_counted") > 0 && (
          <p className="text-muted-foreground">
            {t(
              "assistant.detail.notCounted",
              "{{count}} homes have a household type that is not counted.",
              { count: num("not_counted") }
            )}
          </p>
        )}
        {text("household_types") && (
          <p className="text-muted-foreground">{text("household_types")}</p>
        )}
      </Section>

      <Section title={t("assistant.detail.activity", "Activity")}>
        <p>
          {text("last_visit")
            ? t("assistant.detail.lastVisit", "Last visit {{date}}", {
                date: date(text("last_visit"))
              })
            : t("assistant.detail.neverVisited", "No visits recorded")}
          {" · "}
          {t("assistant.detail.visits30", "{{count}} visits in 30 days", {
            count: num("visits_30_days")
          })}
          {text("last_reset") &&
            ` · ${t("assistant.detail.lastReset", "reset {{date}}", {
              date: date(text("last_reset"))
            })}`}
        </p>
      </Section>

      <Section title={t("assistant.detail.messages", "Messages and notes")}>
        <p>
          {t("assistant.detail.unread", "{{count}} unread messages", {
            count: num("unread_messages")
          })}
          {" · "}
          {t("assistant.detail.withNotes", "{{count}} homes with notes", {
            count: num("homes_with_notes")
          })}
        </p>
        {pinned.map((message) => (
          <p
            key={message}
            className="flex items-start gap-2 rounded-md bg-muted p-2 break-words whitespace-pre-wrap"
          >
            <Pin className="mt-0.5 size-3.5 shrink-0" />
            {message}
          </p>
        ))}
      </Section>

      <Section title={t("assistant.detail.links", "Share links")}>
        {links && links.length > 0 ? (
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={`${link.publisher}-${link.expires}`}>
                <span className="font-medium">{link.publisher}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {t("assistant.action.linkUntil", "until {{date}}", {
                    date: date(link.expires)
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {num("active_links") > 0
              ? t("assistant.detail.activeLinks", "{{count}} active links", {
                  count: num("active_links")
                })
              : t("assistant.detail.free", "Free to assign")}
          </p>
        )}
      </Section>

      {row.has_location !== true && (
        <p className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 p-2">
          <TriangleAlert className="size-3.5 shrink-0" />
          {t("assistant.detail.noLocation", "This map has no location yet.")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {allHomes > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={STEADY_HOVER}
            onClick={onShowHomes}
          >
            <Building2 />
            {t("assistant.detail.showHomes", "Show homes")}
          </Button>
        )}
        {row.has_location === true && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={STEADY_HOVER}
            onClick={onShowOnMap}
          >
            <MapPin />
            {t("assistant.showOnMap", "Show on map")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssistantMapDetail;
