import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  MapPin,
  RefreshCcw,
  Share2,
  TriangleAlert,
  Undo2
} from "lucide-react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { fadeIn, springCalm } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import {
  UNDO_WINDOW_MS,
  isLinkProposal,
  isRoleProposal,
  roleChangeFor,
  type AssistantProposal,
  type ProposalCandidate,
  type ProposalState
} from "../../hooks/useAssistant";
import useNotification from "../../hooks/useNotification";
import useShareLink from "../../hooks/useShareLink";
import assignmentMessage, {
  formatExpiry
} from "../../utils/helpers/assignmentmsg";
import { resolveLocalized } from "../../utils/resolveLocalized";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import { listOf, parseHome, parseSettings } from "../../utils/assistantActions";
import AssistantNewMaps, { allMapsPlaced } from "./assistant-new-maps";
import { KIND_ICONS, STEADY_HOVER, useValueLabel } from "./assistant-shared";

interface AssistantProposalCardProps {
  proposal: AssistantProposal;
  state?: ProposalState;
  // Whether it can be confirmed now: online, and no answer being written.
  actionable: boolean;
  // Undo belongs to a change already made, so any card offers it while online.
  online: boolean;
  onStatus: (patch: Partial<ProposalState>) => void;
  onConfirm: (candidate?: ProposalCandidate) => void;
  onUndo: () => void;
  // Asks the card's question again, for a card that went out of date.
  onAskAgain?: () => void;
  // Shares the admin's location and asks again, for a card that needs it.
  onShareLocation?: () => void;
  // The congregation's country, to look up new maps' addresses there.
  origin?: string;
}

const AssistantProposalCard = ({
  proposal,
  state,
  actionable,
  online,
  onStatus,
  onConfirm,
  onUndo,
  onAskAgain,
  onShareLocation,
  origin
}: AssistantProposalCardProps) => {
  const { t, i18n } = useTranslation();
  const { notifyError } = useNotification();
  const { shareLink, isSharing, shareButtonLabel } = useShareLink();
  const status = state?.status ?? "idle";
  const isRole = isRoleProposal(proposal);
  const isLink = isLinkProposal(proposal);
  const [picked, setPicked] = useState<string | undefined>(
    proposal.candidates.length === 1 ? proposal.candidates[0].userId : undefined
  );
  const candidate =
    state?.candidate ?? proposal.candidates.find((c) => c.userId === picked);
  const name = candidate?.name ?? "";
  const target = proposal.target?.name ?? "";
  const role = roleChangeFor(proposal, candidate);

  // Undo is offered for a while after the change, showing the minutes left,
  // then the button goes and the clock stops.
  const [now, setNow] = useState(() => Date.now());
  const doneAt = status === "done" ? state?.doneAt : undefined;
  useEffect(() => {
    if (!doneAt) return;
    const tick = setInterval(() => {
      setNow(Date.now());
      if (Date.now() - doneAt >= UNDO_WINDOW_MS) clearInterval(tick);
    }, 15_000);
    return () => clearInterval(tick);
  }, [doneAt]);
  // "now" was last read before the change when the card waited a while to be
  // confirmed, so time since the change never counts below zero.
  const undoLeft =
    status === "done" && state?.doneAt
      ? UNDO_WINDOW_MS - Math.max(0, now - state.doneAt)
      : 0;
  const undoOpen = undoLeft > 0;
  const undoMinutes = Math.max(1, Math.ceil(undoLeft / 60_000));

  const label = useValueLabel();
  // A removal's new role is empty.
  const roleLabel = (role: string) =>
    role ? label(role) : t("assistant.action.noAccess", "No access");

  const titles: Record<AssistantProposal["kind"], string> = {
    role_grant: t("assistant.action.titleGrant", "Give access"),
    role_revoke: t("assistant.action.titleRevoke", "Remove access"),
    role_change: t("assistant.action.titleChange", "Change access"),
    map_rename: t("assistant.action.titleMapRename", "Rename map"),
    territory_rename: t(
      "assistant.action.titleTerritoryRename",
      "Rename territory {{code}}",
      { code: target }
    ),
    share_link: t("assistant.action.titleShareLink", "Give a map"),
    pin_message: t("assistant.action.titlePinMessage", "Pin an instruction"),
    report_email: t("assistant.action.titleReport", "Email me the report"),
    mark_read: t("assistant.action.titleMarkRead", "Mark messages read"),
    unpin_message: t("assistant.action.titleUnpin", "Unpin instructions"),
    map_location: t("assistant.action.titleMapLocation", "Set map location"),
    link_revoke: t("assistant.action.titleLinkRevoke", "Take back a map"),
    quick_link: t("assistant.action.titleQuickLink", "Quick link"),
    home_update: t("assistant.action.titleHomeUpdate", "Change a home"),
    map_reset: t("assistant.action.titleMapReset", "Reset map"),
    territory_reset: t(
      "assistant.action.titleTerritoryReset",
      "Reset territory {{code}}",
      { code: target }
    ),
    tries_reset: t(
      "assistant.action.titleTriesReset",
      "Reset nobody-home homes"
    ),
    homes_status: t(
      "assistant.action.titleHomesStatus",
      "Change home statuses"
    ),
    dnc_return: t(
      "assistant.action.titleDncReturn",
      "Return do-not-call homes"
    ),
    settings: t("assistant.action.titleSettings", "Change settings"),
    map_move: t("assistant.action.titleMapMove", "Move map"),
    floor_add: t("assistant.action.titleFloorAdd", "Add a floor"),
    unit_add: t("assistant.action.titleUnitAdd", "Add units"),
    territory_create: t(
      "assistant.action.titleTerritoryCreate",
      "New territory {{code}}, {{name}}",
      { code: target, name: proposal.value ?? "" }
    ),
    maps_create: t("assistant.action.titleMapsCreate", "New maps in {{code}}", {
      code: target
    })
  };
  const Icon = KIND_ICONS[proposal.kind];

  // The warnings the backend raised, in its words for the card.
  const warningText: Record<string, string> = {
    self: t("assistant.action.warnSelf", "You are changing your own access."),
    removes_admin: t(
      "assistant.action.warnRemovesAdmin",
      "{{name}} will no longer be an administrator.",
      { name }
    ),
    already_assigned: t(
      "assistant.action.warnAlreadyAssigned",
      "This map already has an active link."
    ),
    emails_everyone: t(
      "assistant.action.warnEmailsEveryone",
      "Pinned instructions are emailed to everyone in the congregation except administrators, within half an hour."
    ),
    more_unread: t(
      "assistant.action.warnMoreUnread",
      "There are more unread messages; ask again for the rest."
    ),
    moves_far: t(
      "assistant.action.warnMovesFar",
      "You are more than 500 m from where this map is now. Check it is the right map."
    ),
    stops_now: t(
      "assistant.action.warnStopsNow",
      "These links stop working at once, even mid-visit. This cannot be undone; give a new link if needed."
    ),
    leaves_do_not_call:
      proposal.kind === "dnc_return"
        ? t(
            "assistant.action.warnLeavesDncMany",
            "These homes asked not to be called. Publishers will be sent to them again."
          )
        : t(
            "assistant.action.warnLeavesDnc",
            "This home asked not to be called. Publishers will be sent to it again."
          ),
    cannot_undo: t("assistant.action.warnCannotUndo", "This cannot be undone."),
    starts_round: t(
      "assistant.action.warnStartsRound",
      "This also starts the territory's next round."
    ),
    more_homes: t(
      "assistant.action.warnMoreHomes",
      "There are more homes; ask again for the rest."
    ),
    affects_everyone: t(
      "assistant.action.warnAffectsEveryone",
      "This applies to everyone in the congregation."
    ),
    some_exist: t(
      "assistant.action.warnSomeExist",
      "{{units}} already exist and are left out.",
      { units: listOf(proposal.data?.existing).join(", ") }
    )
  };
  const has = (code: string) => role.warnings.includes(code);
  const warnings = [
    ...(proposal.kind === "role_revoke"
      ? [
          t(
            "assistant.action.warnRevoke",
            "{{name}} will no longer be able to open this congregation.",
            { name }
          )
        ]
      : []),
    ...role.warnings.map((code) => warningText[code]).filter(Boolean)
  ];

  // Removing an administrator or touching your own access asks twice.
  const needsSecondStep =
    has("self") ||
    has("removes_admin") ||
    has("leaves_do_not_call") ||
    has("cannot_undo");
  // Without administrator access there is nothing left to undo it with; an
  // email cannot be taken back.
  const canUndo =
    proposal.kind !== "report_email" &&
    proposal.kind !== "link_revoke" &&
    proposal.kind !== "map_reset" &&
    proposal.kind !== "territory_reset" &&
    !(has("self") && role.from === "administrator");
  const ready =
    proposal.kind === "territory_create" || proposal.kind === "maps_create"
      ? allMapsPlaced(proposal, state)
      : !isRole || !!candidate;

  // Sharing must run straight from the click, so nothing is awaited first.
  const pickedMap = resolveLocalized(state?.label, i18n.language);
  const share = async () => {
    if (!state?.recordId || !proposal.target) return;
    try {
      await shareLink({
        linkId: state.recordId,
        message:
          proposal.kind === "quick_link"
            ? assignmentMessage(pickedMap, proposal.value)
            : assignmentMessage(
                proposal.target.name,
                proposal.value,
                proposal.hours,
                proposal.linkType
              )
      });
    } catch (error) {
      notifyError(error);
    }
  };

  const items = proposal.items ?? [];
  const formatDate = (stored: string) => {
    const time = Date.parse(stored);
    return Number.isNaN(time) ? stored : LinkDateFormatter.format(time);
  };

  const people =
    proposal.candidates.length > 1 && status === "idle" && actionable ? (
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground">
          {t("assistant.action.pickPerson", "Which person?")}
        </span>
        <RadioGroup
          value={picked ?? ""}
          onValueChange={(value) => setPicked(String(value))}
          className="flex flex-col gap-2"
        >
          {proposal.candidates.map((c) => (
            <label
              key={c.userId}
              className="flex cursor-pointer items-center gap-2"
            >
              <RadioGroupItem value={c.userId} />
              <span className="min-w-0 truncate">
                {c.name}{" "}
                <span className="text-muted-foreground">{c.email}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>
    ) : candidate ? (
      <div className="min-w-0 truncate">
        <span className="font-medium">{candidate.name}</span>{" "}
        <span className="text-muted-foreground">{candidate.email}</span>
      </div>
    ) : null;

  const change = (from: string, to: string): ReactNode => (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {from && (
        <>
          <span className="break-words">{from}</span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
        </>
      )}
      <span className="font-medium break-words">{to}</span>
    </div>
  );

  const body = (): ReactNode => {
    switch (proposal.kind) {
      case "map_rename":
      case "territory_rename":
        return change(proposal.from, proposal.to);
      case "share_link":
        return (
          <div className="flex flex-col gap-1">
            <span>
              <span className="font-medium">{proposal.value}</span>
              <span className="text-muted-foreground"> · {target}</span>
            </span>
            <span className="text-muted-foreground">
              {proposal.linkType === "personal"
                ? t("assistant.action.personalLink", "Personal link")
                : t("assistant.action.normalLink", "Normal link")}
              {" · "}
              {t("assistant.action.linkLasts", "lasts {{duration}}", {
                duration: formatExpiry(proposal.hours ?? 0)
              })}
            </span>
          </div>
        );
      case "pin_message":
        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{target}</span>
            <p className="rounded-md bg-muted p-2 break-words whitespace-pre-wrap">
              {proposal.value}
            </p>
          </div>
        );
      case "mark_read": {
        const perMap = new Map<string, number>();
        for (const item of items) {
          perMap.set(item.label, (perMap.get(item.label) ?? 0) + 1);
        }
        return (
          <p>
            {t("assistant.detail.unread", "{{count}} unread messages", {
              count: items.length
            })}
            <span className="text-muted-foreground">
              {" · "}
              {[...perMap].map(([map, n]) => `${map} (${n})`).join(", ")}
            </span>
          </p>
        );
      }
      case "unpin_message":
        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{target}</span>
            {items.map((item) => (
              <p
                key={item.id}
                className="rounded-md bg-muted p-2 break-words whitespace-pre-wrap"
              >
                {item.label}
              </p>
            ))}
          </div>
        );
      case "map_location":
        return (
          <p>
            {t(
              "assistant.action.mapLocationBody",
              "Set {{map}} to where you are standing now.",
              { map: target }
            )}
          </p>
        );
      case "link_revoke":
        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{target}</span>
            {items.map((item) => (
              <span key={item.id}>
                <span className="font-medium">{item.label}</span>
                {item.detail && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {t("assistant.action.linkUntil", "until {{date}}", {
                      date: formatDate(item.detail)
                    })}
                  </span>
                )}
              </span>
            ))}
          </div>
        );
      case "quick_link":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{proposal.value}</span>
            <span className="text-muted-foreground">
              {pickedMap
                ? pickedMap
                : t(
                    "assistant.action.quickLinkBody",
                    "The best map near you in {{code}}, picked when you confirm.",
                    { code: target }
                  )}
            </span>
          </div>
        );
      case "territory_create":
      case "maps_create":
        return (
          <AssistantNewMaps
            proposal={proposal}
            state={state}
            editable={actionable && status === "idle"}
            origin={origin}
            onStatus={onStatus}
          />
        );
      case "map_reset":
      case "territory_reset": {
        const done = Number(proposal.data?.done ?? 0);
        const notHome = Number(proposal.data?.not_home ?? 0);
        return (
          <div className="flex flex-col gap-1">
            {proposal.kind === "map_reset" && (
              <span className="text-muted-foreground">{target}</span>
            )}
            <p>
              {t(
                "assistant.action.resetBody",
                "{{count}} homes go back to not done: {{done}} done, {{notHome}} not home.",
                { count: done + notHome, done, notHome }
              )}
            </p>
            <p className="text-muted-foreground">
              {t(
                "assistant.action.resetKeeps",
                "Do-not-call and invalid homes stay as they are."
              )}
            </p>
          </div>
        );
      }
      case "tries_reset":
      case "homes_status":
      case "dnc_return": {
        const shown = items.slice(0, 10);
        return (
          <div className="flex flex-col gap-1">
            <p>
              {proposal.kind === "dnc_return"
                ? t(
                    "assistant.action.dncReturnBody",
                    "{{count}} homes marked do not call over {{months}} months ago go back to not done.",
                    {
                      count: items.length,
                      months: Number(proposal.data?.months ?? 0)
                    }
                  )
                : proposal.kind === "homes_status"
                  ? t(
                      "assistant.action.homesStatusBody",
                      "{{count}} homes change to {{status}}.",
                      { count: items.length, status: label(proposal.to) }
                    )
                  : t(
                      "assistant.action.triesResetBody",
                      "{{count}} homes at the nobody-home limit go back to not done.",
                      { count: items.length }
                    )}
            </p>
            {proposal.kind === "homes_status" && (
              <p className="text-muted-foreground">
                {t(
                  "assistant.action.resetKeeps",
                  "Do-not-call and invalid homes stay as they are."
                )}
              </p>
            )}
            <p className="text-muted-foreground">
              {shown.map((item) => item.label).join(", ")}
              {items.length > shown.length &&
                ` ${t("assistant.action.andMore", "and {{count}} more", {
                  count: items.length - shown.length
                })}`}
            </p>
          </div>
        );
      }
      case "settings": {
        const before = parseSettings(proposal.previous);
        const after = parseSettings(proposal.value);
        const rows: Array<[string, keyof typeof before]> = [
          [t("congregation.numberOfTries", "No. of Tries"), "max_tries"],
          [
            t("congregation.defaultSlipExpiry", "Default Slip Expiry Hours"),
            "expiry_hours"
          ],
          [
            t(
              "assistant.action.completionThreshold",
              "Territory completed at (%)"
            ),
            "completion_threshold"
          ]
        ];
        return (
          <div className="flex flex-col gap-1">
            {rows
              .filter(([, field]) => before[field] !== after[field])
              .map(([label, field]) => (
                <div key={field} className="flex flex-col">
                  <span className="text-muted-foreground">{label}</span>
                  {change(String(before[field]), String(after[field]))}
                </div>
              ))}
          </div>
        );
      }
      case "map_move":
        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{target}</span>
            {change(proposal.from, proposal.to)}
          </div>
        );
      case "floor_add":
        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{target}</span>
            <p>
              {t(
                "assistant.action.floorAddBody",
                "Floor {{floor}}, with units {{units}}.",
                {
                  floor: Number(proposal.data?.floor ?? 0),
                  units: listOf(proposal.data?.units).join(", ")
                }
              )}
            </p>
          </div>
        );
      case "unit_add": {
        const floors = Number(proposal.data?.floors ?? 1);
        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{target}</span>
            <p className="font-medium">
              {listOf(proposal.data?.units).join(", ")}
            </p>
            {floors > 1 && (
              <p className="text-muted-foreground">
                {t(
                  "assistant.action.unitAddFloors",
                  "Added on each of the {{count}} floors.",
                  { count: floors }
                )}
              </p>
            )}
          </div>
        );
      }
      case "home_update": {
        const before = parseHome(proposal.previous);
        const after = parseHome(proposal.value);
        return (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">
              {target} · {items[0]?.label}
            </span>
            {before.status !== after.status &&
              change(label(before.status), label(after.status))}
            {before.notes !== after.notes && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">
                  {t("assistant.action.note", "Note")}
                </span>
                {before.notes && (
                  <p className="break-words whitespace-pre-wrap text-muted-foreground line-through">
                    {before.notes}
                  </p>
                )}
                <p className="break-words whitespace-pre-wrap">
                  {after.notes ||
                    t("assistant.action.noteCleared", "(no note)")}
                </p>
              </div>
            )}
            {before.type_names.join() !== after.type_names.join() &&
              change(before.type_names.join(", "), after.type_names.join(", "))}
          </div>
        );
      }
      case "report_email":
        return (
          <p className="text-muted-foreground">
            {t(
              "assistant.action.reportBody",
              "The congregation's report will be emailed to you."
            )}
          </p>
        );
      default:
        return (
          <>
            {people}
            {change(
              proposal.kind === "role_grant" ? "" : roleLabel(role.from),
              roleLabel(proposal.to)
            )}
          </>
        );
    }
  };

  const footer = () => {
    if (role.blocked === "last_admin") {
      return (
        <p className="text-muted-foreground">
          {t(
            "assistant.action.blockedLastAdmin",
            "This congregation must keep an administrator, so this change cannot be made."
          )}
        </p>
      );
    }
    switch (status) {
      case "running":
      case "undoing":
        return (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            {status === "running"
              ? t("assistant.action.running", "Making the change…")
              : t("assistant.action.undoing", "Undoing…")}
          </p>
        );
      case "done":
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-success">
              {proposal.kind === "report_email"
                ? t(
                    "congregation.reportGenerationStarted",
                    "Report generation started. You will receive an email shortly."
                  )
                : t("assistant.action.done", "Done.")}
            </span>
            {state?.error && (
              <span className="text-muted-foreground">{state.error}</span>
            )}
            {/* A link card from history whose link no longer works. */}
            {isLink && !state?.recordId && (
              <span className="text-muted-foreground">
                {t("assistant.history.linkEnded", "Link ended")}
              </span>
            )}
            {!!state?.skipped && (
              <span className="text-muted-foreground">
                {t(
                  "assistant.action.skipped",
                  "{{count}} homes had changed since and were left.",
                  { count: state.skipped }
                )}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              {/* Your own access shapes the whole page, so it shows once the
                  page loads again. Not on cards brought back from history. */}
              {isRole && has("self") && !!state?.doneAt && (
                <Button
                  type="button"
                  size="sm"
                  className={STEADY_HOVER}
                  onClick={() => window.location.reload()}
                >
                  <RefreshCcw />
                  {t(
                    "assistant.action.reload",
                    "Reload to use your new access"
                  )}
                </Button>
              )}
              {isLink && state?.recordId && (
                <Button
                  type="button"
                  size="sm"
                  className={STEADY_HOVER}
                  disabled={isSharing}
                  onClick={() => void share()}
                >
                  <Share2 />
                  {shareButtonLabel}
                </Button>
              )}
              {undoOpen && canUndo && online && (
                <>
                  <span className="self-center text-xs text-muted-foreground">
                    {t("assistant.action.undoLeft", "{{count}} min left", {
                      count: undoMinutes
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={STEADY_HOVER}
                    onClick={onUndo}
                  >
                    <Undo2 />
                    {t("assistant.action.undo", "Undo")}
                  </Button>
                </>
              )}
              {undoOpen && canUndo && !online && (
                <span className="text-muted-foreground">
                  {t(
                    "assistant.action.undoOffline",
                    "Undo is available when you are back online."
                  )}
                </span>
              )}
            </div>
          </div>
        );
      case "undone":
        return (
          <p className="text-muted-foreground">
            {t("assistant.action.undone", "Undone.")}
          </p>
        );
      case "cancelled":
        return (
          <p className="text-muted-foreground">
            {t("assistant.action.cancelled", "Cancelled.")}
          </p>
        );
      case "stale":
        return (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">
              {isRole
                ? t(
                    "assistant.action.stale",
                    "This person's access changed since this was prepared. Ask again."
                  )
                : t(
                    "assistant.action.staleRecord",
                    "This changed since it was prepared. Ask again."
                  )}
            </p>
            {onAskAgain && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(STEADY_HOVER, "self-start")}
                onClick={onAskAgain}
              >
                <RefreshCcw />
                {t("assistant.action.askAgain", "Ask again")}
              </Button>
            )}
          </div>
        );
      case "failed":
        return (
          <div className="flex flex-col gap-2">
            <p className="text-destructive">
              {t("assistant.action.failed", "The change could not be made.")}{" "}
              <span className="text-muted-foreground">{state?.error}</span>
            </p>
            {onShareLocation ? (
              <Button
                type="button"
                size="sm"
                className={cn(STEADY_HOVER, "self-start")}
                onClick={onShareLocation}
              >
                <MapPin />
                {t("assistant.useLocation", "Use my location")}
              </Button>
            ) : (
              actionable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(STEADY_HOVER, "self-start")}
                  onClick={() => onStatus({ status: "idle", error: undefined })}
                >
                  {t("assistant.retry", "Try again")}
                </Button>
              )
            )}
          </div>
        );
      case "confirming":
        return (
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              {t("assistant.action.sureTitle", "Are you sure?")}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={STEADY_HOVER}
                onClick={() => onStatus({ status: "idle" })}
              >
                {t("assistant.action.back", "Back")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className={STEADY_HOVER}
                disabled={!ready || !actionable}
                onClick={() => onConfirm(candidate)}
              >
                {t("assistant.action.sureYes", "Yes, make the change")}
              </Button>
            </div>
          </div>
        );
      default:
        if (!online) {
          return (
            <p className="text-muted-foreground">
              {t(
                "assistant.action.notConfirmedOffline",
                "Connect to the internet to confirm this change."
              )}
            </p>
          );
        }
        return (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={STEADY_HOVER}
              onClick={() => onStatus({ status: "cancelled" })}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className={STEADY_HOVER}
              disabled={!ready || !actionable}
              onClick={() =>
                needsSecondStep
                  ? onStatus({ status: "confirming", candidate })
                  : onConfirm(candidate)
              }
            >
              {t("assistant.action.confirm", "Confirm")}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {titles[proposal.kind]}
      </div>
      {body()}
      {warnings.length > 0 && status !== "done" && status !== "undone" && (
        <div className="flex flex-col gap-1 rounded-md border border-warning/30 bg-warning/10 p-2">
          {warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {warning}
            </p>
          ))}
        </div>
      )}
      {/* Read out as the outcome changes: making it, done, undone, failed.
          The card glides to its new height and the outcome fades in, so it
          reads as the result of the click rather than a jump. */}
      <div aria-live="polite">
        <AutoHeight>
          <m.div key={status} initial="hidden" animate="show" variants={fadeIn}>
            {footer()}
          </m.div>
        </AutoHeight>
      </div>
    </div>
  );
};

// Animates to its content's measured height. The margin and padding keep
// focus rings clear of the clipping edge.
function AutoHeight({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState<number | "auto">("auto");
  return (
    <m.div
      initial={false}
      animate={{ height }}
      transition={springCalm}
      className="-m-1 overflow-hidden"
    >
      <div
        className="p-1"
        ref={(element) => {
          if (!element) return;
          const observer = new ResizeObserver(([entry]) =>
            setHeight(entry.borderBoxSize[0].blockSize)
          );
          observer.observe(element);
          return () => observer.disconnect();
        }}
      >
        {children}
      </div>
    </m.div>
  );
}

export default AssistantProposalCard;
