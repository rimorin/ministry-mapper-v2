import NiceModal from "@ebay/nice-modal-react";
import { useState, FormEvent } from "react";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import MemberPicker from "@/components/common/member-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
import { listItemPresence } from "@/lib/motion";
import SubmitButton from "../common/submit-button";
import { getIsMobile } from "../../hooks/use-mobile";
import useConfirm from "../../hooks/useConfirm";
import useNotification from "../../hooks/useNotification";
import {
  createData,
  deleteDataById,
  updateDataById
} from "../../utils/pocketbase";
import {
  byName,
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

interface EditGroupProps {
  congregation: string;
  // A new group has an empty id.
  group: CongregationGroup;
  members: CongregationMember[];
  // The other groups' names, which this one cannot take.
  taken: string[];
}

// Makes, renames, fills or deletes a group. Resolves true once it has changed.
const EditGroup = NiceModal.create(
  ({ congregation, group, members, taken }: EditGroupProps) => {
    const { t } = useTranslation();
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { notifySuccess, runAction } = useNotification();
    const { confirm } = useConfirm();
    const [name, setName] = useState(group.name);
    const [nameError, setNameError] = useState("");
    const [chosen, setChosen] = useState(() =>
      members.filter((member) => group.members.includes(member.id))
    );
    const [isSaving, setIsSaving] = useState(false);

    const done = () => {
      modal.resolve(true);
      modal.hide();
    };

    const handleSubmit = (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setNameError(t("groups.nameRequired", "Give the group a name."));
        return;
      }
      if (
        taken.some((other) => other.toLowerCase() === trimmed.toLowerCase())
      ) {
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
          done();
        },
        { setLoading: setIsSaving }
      );
    };

    const handleDelete = async () => {
      const confirmed = await confirm({
        title: t("groups.deleteTitle", "Delete {{name}}?", {
          name: group.name
        }),
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
          done();
        }
      });
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {group.name || t("groups.new", "New group")}
            </DialogTitle>
          </DialogHeader>
          {/* min-w-0: a long email would otherwise widen the dialog's grid. */}
          <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
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
                                  <Avatar>
                                    <AvatarFallback className="text-xs font-medium">
                                      {initials(member.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </ItemMedia>
                                <ItemContent className="min-w-0 gap-0">
                                  <ItemTitle className="w-full">
                                    <span className="truncate">
                                      {member.name}
                                    </span>
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
                                      { name: member.name }
                                    )}
                                    onClick={() =>
                                      setChosen((current) =>
                                        current.filter(
                                          ({ id }) => id !== member.id
                                        )
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
                  {t(
                    "groups.membersHint",
                    "People can be in more than one group."
                  )}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter className="grid grid-cols-2 sm:flex">
              {group.id && (
                <Button
                  type="button"
                  variant="destructive"
                  className="order-last col-span-2 sm:order-none sm:mr-auto"
                  onClick={handleDelete}
                >
                  {t("groups.delete", "Delete group")}
                </Button>
              )}
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <SubmitButton pending={isSaving}>
                {t("common.save", "Save")}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default EditGroup;
