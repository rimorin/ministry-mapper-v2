import { useEffect, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AssistantIcon } from "@/components/common/assistant-icon";
import useConfirm from "../../hooks/useConfirm";
import useNotification from "../../hooks/useNotification";
import {
  deleteConversation,
  listConversations,
  openConversation,
  renameConversation,
  type ConversationSummary,
  type PastConversation
} from "../../hooks/useAssistant";
import { isAbortError } from "../../utils/pocketbase";
import { STEADY_HOVER } from "./assistant-shared";

// Mirrors maxConversationTitle in the backend.
const MAX_TITLE_LENGTH = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// How many whole days ago a time was, by the reader's calendar.
const daysAgo = (iso: string, now: Date) =>
  Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY_MS);

interface AssistantHistoryProps {
  congregation: string;
  onBack: () => void;
  // One opened, to bring back into the chat, and one deleted.
  onOpen: (past: PastConversation) => void;
  onDeleted: (id: string) => void;
}

// The admin's past conversations in this congregation, grouped by when they
// last asked, to open, rename or delete.
const AssistantHistory = ({
  congregation,
  onBack,
  onOpen,
  onDeleted
}: AssistantHistoryProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const { notifyError } = useNotification();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<ConversationSummary[]>();
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [opening, setOpening] = useState<string>();
  const [renaming, setRenaming] = useState<{ id: string; text: string }>();

  const load = async (offset = 0) => {
    setFailed(false);
    try {
      const page = await listConversations(congregation, offset);
      setItems((previous) =>
        offset === 0
          ? page.conversations
          : [...(previous ?? []), ...page.conversations]
      );
      setMore(page.more);
    } catch (error) {
      if (!isAbortError(error)) setFailed(true);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- once, when history opens
  }, [congregation]);

  const showMore = async () => {
    setLoadingMore(true);
    await load(items?.length ?? 0);
    setLoadingMore(false);
  };

  const open = async (id: string) => {
    setOpening(id);
    try {
      onOpen(await openConversation(congregation, id));
    } catch (error) {
      if (!isAbortError(error)) notifyError(error);
    } finally {
      setOpening(undefined);
    }
  };

  // Saves the new name; an empty one goes back to showing the first question.
  const saveRename = async () => {
    if (!renaming) return;
    const { id, text } = renaming;
    setRenaming(undefined);
    const title = text.trim();
    const item = items?.find((candidate) => candidate.id === id);
    if (item?.title === title) return;
    try {
      await renameConversation(congregation, id, title);
      setItems((previous) =>
        previous?.map((candidate) =>
          candidate.id === id ? { ...candidate, title } : candidate
        )
      );
    } catch (error) {
      if (!isAbortError(error)) notifyError(error);
    }
  };

  const remove = async (id: string) => {
    const sure = await confirm({
      title: t("assistant.history.deleteTitle", "Delete this conversation?"),
      message: t(
        "assistant.history.deleteBody",
        "Its questions and answers are removed for good. Changes made from it stay made."
      ),
      confirmText: t("assistant.history.delete", "Delete"),
      variant: "danger"
    });
    if (!sure) return;
    try {
      await deleteConversation(congregation, id);
      setItems((previous) =>
        previous?.filter((candidate) => candidate.id !== id)
      );
      onDeleted(id);
    } catch (error) {
      if (!isAbortError(error)) notifyError(error);
    }
  };

  const onRenameKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveRename();
    } else if (event.key === "Escape") {
      // Cancels the rename only, not the panel.
      event.preventDefault();
      event.stopPropagation();
      setRenaming(undefined);
    }
  };

  const renameInput = (id: string, title: string) => (
    <Input
      // Focus moves into the field, as the admin just chose Rename.
      autoFocus
      value={renaming?.text ?? ""}
      maxLength={MAX_TITLE_LENGTH}
      aria-label={t("assistant.history.renameLabel", "Conversation name")}
      placeholder={title}
      onChange={(event) => setRenaming({ id, text: event.currentTarget.value })}
      onKeyDown={onRenameKey}
      onBlur={() => void saveRename()}
    />
  );

  const menu = ({ id, title: name }: ConversationSummary, title: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(STEADY_HOVER, "shrink-0")}
            aria-label={t(
              "assistant.history.options",
              "Options for {{title}}",
              {
                title
              }
            )}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setRenaming({ id, text: name })}>
          <Pencil />
          {t("assistant.history.rename", "Rename")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => void remove(id)}>
          <Trash2 />
          {t("assistant.history.delete", "Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const formatDate = (iso: string, options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(locale, options).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  // Today, Yesterday and the past week by name; older ones by month.
  const now = new Date();
  const groupOf = (iso: string) => {
    const days = daysAgo(iso, now);
    if (days <= 0) return t("assistant.history.today", "Today");
    if (days === 1) return t("assistant.history.yesterday", "Yesterday");
    if (days < 7) return t("assistant.history.week", "Past 7 days");
    return formatDate(iso, { month: "long", year: "numeric" });
  };
  const groups: { label: string; items: ConversationSummary[] }[] = [];
  for (const item of items ?? []) {
    const label = groupOf(item.lastQuestion);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={STEADY_HOVER}
          aria-label={t("assistant.canvas.backToChat", "Back to chat")}
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <h2 className="font-heading text-base font-medium">
          {t("assistant.history.title", "Conversations")}
          {items && items.length > 0 && (
            <span className="ml-1.5 text-muted-foreground">
              ({items.length}
              {more ? "+" : ""})
            </span>
          )}
        </h2>
      </div>

      {failed ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-muted-foreground">
            {t(
              "assistant.history.loadFailed",
              "Could not load your conversations."
            )}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={STEADY_HOVER}
            onClick={() => void load()}
          >
            <RefreshCcw />
            {t("assistant.retry", "Try again")}
          </Button>
        </div>
      ) : !items ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <Empty className="min-h-0 flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AssistantIcon />
            </EmptyMedia>
            <EmptyTitle>
              {t("assistant.history.empty", "No conversations yet")}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                "assistant.history.emptyBody",
                "Questions you ask are kept here, so you can come back to them."
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-1">
              <h3 className="px-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </h3>
              <ul className="flex flex-col">
                {group.items.map((item) => {
                  const title = item.title || item.firstQuestion;
                  const recent = daysAgo(item.lastQuestion, now) <= 1;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-1 rounded-md hover:bg-muted/50"
                    >
                      {renaming?.id === item.id ? (
                        <div className="flex-1 p-1">
                          {renameInput(item.id, title)}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="min-w-0 flex-1 rounded-md px-2 py-2 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          disabled={opening !== undefined}
                          onClick={() => void open(item.id)}
                        >
                          <span className="block truncate text-sm">
                            {title}
                          </span>
                          <span
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                            title={formatDate(item.lastQuestion, {
                              dateStyle: "full",
                              timeStyle: "short"
                            })}
                          >
                            {t(
                              "assistant.history.questions",
                              "{{count}} questions",
                              { count: item.questions }
                            )}
                            {" · "}
                            {formatDate(
                              item.lastQuestion,
                              recent
                                ? { timeStyle: "short" }
                                : { dateStyle: "medium" }
                            )}
                            {opening === item.id && (
                              <Spinner className="size-3" />
                            )}
                          </span>
                        </button>
                      )}
                      {menu(item, title)}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {more && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(STEADY_HOVER, "self-center")}
              disabled={loadingMore}
              onClick={() => void showMore()}
            >
              {loadingMore && <Spinner />}
              {t("assistant.history.showMore", "Show more")}
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {t(
          "assistant.history.retention",
          "Conversations are deleted 90 days after their last question."
        )}
      </p>
    </div>
  );
};

export default AssistantHistory;
