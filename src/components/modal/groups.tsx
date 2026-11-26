import NiceModal from "@ebay/nice-modal-react";
import { useEffect, useState, FormEvent } from "react";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Plus, Tags, X } from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import MemberPicker from "@/components/common/member-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { duration, fadeIn, listItemPresence } from "@/lib/motion";
import SubmitButton from "../common/submit-button";
import { getIsMobile } from "../../hooks/use-mobile";
import useConfirm from "../../hooks/useConfirm";
import useNotification from "../../hooks/useNotification";
import {
  createData,
  deleteDataById,
  updateDataById
} from "../../utils/pocketbase";
import getCongregationMembers, {
  byName,
  getCongregationGroups,
  namesOf,
  type CongregationGroup,
  type CongregationMember
} from "../../utils/helpers/getcongregationmembers";

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const MemberAvatar = ({ name }: { name: string }) => (
  <Avatar>
    <AvatarFallback className="text-xs font-medium">
      {initials(name)}
    </AvatarFallback>
  </Avatar>
);

const NEW_GROUP: CongregationGroup = { id: "", name: "", members: [] };

// The list and a group's form fade from one to the other. min-w-0 keeps a
// long name or email from widening the dialog's grid.
const view = {
  variants: fadeIn,
  initial: "hidden",
  animate: "show",
  exit: { opacity: 0, transition: { duration: duration.fast } },
  className: "flex min-w-0 flex-col gap-6"
} as const;

interface GroupFormProps {
  congregation: string;
  group: CongregationGroup;
  members: CongregationMember[];
  // The other groups' names, which this one cannot take.
  taken: string[];
  onDone: (changed: boolean) => void;
}

const GroupForm = ({
  congregation,
  group,
  members,
  taken,
  onDone
}: GroupFormProps) => {
  const { t } = useTranslation();
  const { notifySuccess, runAction } = useNotification();
  const { confirm } = useConfirm();
  const [name, setName] = useState(group.name);
  const [nameError, setNameError] = useState("");
  const [chosen, setChosen] = useState(() =>
    members.filter((member) => group.members.includes(member.id))
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("groups.nameRequired", "Give the group a name."));
      return;
    }
    if (taken.some((other) => other.toLowerCase() === trimmed.toLowerCase())) {
      setNameError(
        t("groups.nameTaken", "There's already a group called {{name}}.", {
          name: trimmed
        })
      );
      return;
    }
    // Accounts the roster leaves out, ones that cannot sign in, stay in.
    const unlisted = group.members.filter(
      (id) => !members.some((member) => member.id === id)
    );
    const body = {
      name: trimmed,
      members: [...chosen.map((member) => member.id), ...unlisted]
    };
    const requestKey = `group-${group.id || "new"}`;
    void runAction(
      async () => {
        await (group.id
          ? updateDataById("groups", group.id, body, { requestKey })
          : createData("groups", { ...body, congregation }, { requestKey }));
        notifySuccess(t("groups.saved", "Group saved"));
        onDone(true);
      },
      { setLoading: setIsSaving }
    );
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t("groups.deleteTitle", "Delete {{name}}?", { name: group.name }),
      message: t(
        "groups.deleteMessage",
        "Only the group goes. Its members and their maps stay as they are."
      ),
      confirmText: t("common.delete", "Delete")
    });
    if (!confirmed) return;
    void runAction(async () => {
      if (await deleteDataById("groups", group.id)) {
        notifySuccess(t("groups.deleted", "Group deleted"));
        onDone(true);
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{group.name || t("groups.new", "New group")}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="group-name">
              {t("common.name", "Name")}
            </FieldLabel>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              placeholder={t("groups.namePlaceholder", "Group 3")}
              maxLength={50}
              required
              // A new group starts at its name; a phone keeps its keyboard
              // down until the field is tapped.
              autoFocus={!group.id && !getIsMobile()}
              aria-invalid={!!nameError || undefined}
              aria-describedby={nameError ? "group-name-error" : undefined}
            />
            {nameError && (
              <FieldError id="group-name-error">{nameError}</FieldError>
            )}
          </Field>
          <Field>
            <div className="flex items-baseline justify-between">
              <FieldLabel>{t("groups.members", "Members")}</FieldLabel>
              <span className="text-sm text-muted-foreground tabular-nums">
                {chosen.length}
              </span>
            </div>
            <MemberPicker
              members={members}
              value={chosen}
              onValueChange={setChosen}
              autoFocus={false}
              roster
              title={name.trim() || t("groups.new", "New group")}
            />
            {chosen.length > 0 && (
              <ScrollArea withFade className="max-h-64 rounded-lg border">
                <ItemGroup className="gap-0">
                  <AnimatePresence>
                    {[...chosen]
                      .sort((a, b) => byName(a.name, b.name))
                      .map((member, index) => (
                        <m.div
                          key={member.id}
                          role="listitem"
                          variants={listItemPresence}
                          custom={index}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                          className="border-b last:border-b-0"
                        >
                          <Item
                            size="sm"
                            className="flex-nowrap rounded-none border-0"
                          >
                            <ItemMedia>
                              <MemberAvatar name={member.name} />
                            </ItemMedia>
                            <ItemContent className="min-w-0 gap-0">
                              <ItemTitle className="w-full">
                                <span className="truncate">{member.name}</span>
                              </ItemTitle>
                              {member.email && (
                                <ItemDescription className="truncate">
                                  {member.email}
                                </ItemDescription>
                              )}
                            </ItemContent>
                            <ItemActions>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t(
                                  "groups.remove",
                                  "Remove {{name}}",
                                  {
                                    name: member.name
                                  }
                                )}
                                onClick={() =>
                                  setChosen((current) =>
                                    current.filter(({ id }) => id !== member.id)
                                  )
                                }
                              >
                                <X aria-hidden="true" />
                              </Button>
                            </ItemActions>
                          </Item>
                        </m.div>
                      ))}
                  </AnimatePresence>
                </ItemGroup>
              </ScrollArea>
            )}
            <FieldDescription>
              {t("groups.membersHint", "People can be in more than one group.")}
            </FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          {group.id && (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              onClick={handleDelete}
            >
              {t("groups.delete", "Delete group")}
            </Button>
          )}
          <Button variant="outline" type="button" onClick={() => onDone(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <SubmitButton pending={isSaving}>
            {t("common.save", "Save")}
          </SubmitButton>
        </DialogFooter>
      </form>
    </>
  );
};

// A congregation's groups, which narrow the member picker to the people a
// conductor works with. Listed here and changed in place.
const Groups = NiceModal.create(
  ({ congregation }: { congregation: string }) => {
    const { t } = useTranslation();
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const [groups, setGroups] = useState<CongregationGroup[]>();
    const [members, setMembers] = useState<CongregationMember[]>();
    const [editing, setEditing] = useState<CongregationGroup>();
    // Bumped after a change, to read the groups again.
    const [version, setVersion] = useState(0);

    useEffect(() => {
      getCongregationMembers(congregation)
        .then(setMembers)
        .catch(() => setMembers([]));
    }, [congregation]);

    useEffect(() => {
      getCongregationGroups(congregation)
        .then(setGroups)
        .catch(() => setGroups([]));
    }, [congregation, version]);

    const roster = members ?? [];
    const ungrouped = roster.filter(
      (member) => !groups?.some((group) => group.members.includes(member.id))
    );

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <m.div key={`group-${editing.id || "new"}`} {...view}>
                <GroupForm
                  congregation={congregation}
                  group={editing}
                  members={roster}
                  taken={(groups ?? [])
                    .filter((group) => group.id !== editing.id)
                    .map((group) => group.name)}
                  onDone={(changed) => {
                    setEditing(undefined);
                    if (changed) setVersion((current) => current + 1);
                  }}
                />
              </m.div>
            ) : (
              <m.div key="list" {...view}>
                <DialogHeader>
                  <DialogTitle>{t("groups.title", "Groups")}</DialogTitle>
                  <DialogDescription>
                    {t(
                      "groups.description",
                      "Narrow the member list to a group when you send someone a map."
                    )}
                  </DialogDescription>
                </DialogHeader>
                {!groups || !members ? (
                  <Spinner className="mx-auto my-6" />
                ) : groups.length === 0 ? (
                  <Empty className="py-6">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Tags aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        {t("groups.empty", "No groups yet")}
                      </EmptyTitle>
                      <EmptyDescription>
                        {t(
                          "groups.emptyDescription",
                          "Add your field service groups, a language group or visitors supporting the congregation."
                        )}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  // Scrolls rather than grows, so the buttons stay on screen.
                  <ScrollArea
                    withFade
                    className="max-h-[min(24rem,50dvh)] rounded-lg border"
                  >
                    <ItemGroup className="gap-0">
                      {groups.map((group) => {
                        const people = roster.filter((member) =>
                          group.members.includes(member.id)
                        );
                        return (
                          <div
                            key={group.id}
                            role="listitem"
                            className="border-b last:border-b-0"
                          >
                            <Item
                              className="flex-nowrap rounded-none border-0 text-left hover:bg-accent"
                              render={
                                <button
                                  type="button"
                                  onClick={() => setEditing(group)}
                                />
                              }
                            >
                              <ItemContent className="min-w-0 gap-0">
                                <ItemTitle className="w-full">
                                  <span className="truncate">{group.name}</span>
                                </ItemTitle>
                                {people.length > 0 && (
                                  <ItemDescription className="truncate">
                                    {namesOf(people)}
                                  </ItemDescription>
                                )}
                              </ItemContent>
                              <ItemActions className="shrink-0">
                                <Badge
                                  variant="secondary"
                                  className="tabular-nums"
                                >
                                  <span aria-hidden="true">
                                    {group.members.length}
                                  </span>
                                  <span className="sr-only">
                                    {t("groups.people", "{{count}} people", {
                                      count: group.members.length
                                    })}
                                  </span>
                                </Badge>
                                <ChevronRight
                                  className="size-4 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              </ItemActions>
                            </Item>
                          </div>
                        );
                      })}
                    </ItemGroup>
                  </ScrollArea>
                )}
                <DialogFooter className="sm:items-center">
                  {!!groups?.length && ungrouped.length > 0 && (
                    <p className="text-center text-sm text-muted-foreground sm:mr-auto sm:text-left">
                      {t(
                        "groups.ungrouped",
                        "{{count}} people aren't in a group",
                        { count: ungrouped.length }
                      )}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => modal.hide()}
                  >
                    {t("common.close", "Close")}
                  </Button>
                  <Button type="button" onClick={() => setEditing(NEW_GROUP)}>
                    <Plus aria-hidden="true" />
                    {t("groups.new", "New group")}
                  </Button>
                </DialogFooter>
              </m.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    );
  }
);

export default Groups;
