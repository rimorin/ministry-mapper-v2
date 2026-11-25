import NiceModal from "@ebay/nice-modal-react";
import { useEffect, useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import MemberPicker from "@/components/common/member-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import SubmitButton from "../common/submit-button";
import useNotification from "../../hooks/useNotification";
import { callFunction } from "../../utils/pocketbase";
import getCongregationMembers, {
  CongregationMember,
  namesOf
} from "../../utils/helpers/getcongregationmembers";
import type { LinkSession } from "../../utils/policies";

interface ChangeAssigneesProps {
  assignment: LinkSession;
}

export interface ChangedAssignees {
  holders: LinkSession["holders"];
  publisherName: string;
}

// Changes which accounts an open link is given to. Resolves with the new
// holders, for the list that opened it.
const ChangeAssignees = NiceModal.create(
  ({ assignment }: ChangeAssigneesProps) => {
    const { t } = useTranslation();
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { notifySuccess, runAction } = useNotification();
    const [members, setMembers] = useState<CongregationMember[]>([]);
    const [chosen, setChosen] = useState<CongregationMember[]>(() =>
      assignment.holders.map((holder) => ({
        ...holder,
        email: "",
        role: "",
        maps: []
      }))
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (!assignment.congregation) return;
      getCongregationMembers(assignment.congregation)
        .then(setMembers)
        .catch(() => {});
    }, [assignment.congregation]);

    const handleSubmit = (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      void runAction(
        async () => {
          // The link's name follows its members unless it was typed by hand.
          const followsMembers =
            assignment.publisherName === namesOf(assignment.holders);
          const response = (await callFunction("/assignment/assignees", {
            method: "POST",
            body: {
              assignment: assignment.id,
              assignees: chosen.map((member) => member.id),
              ...(followsMembers &&
                chosen.length > 0 && { publisher: namesOf(chosen) })
            },
            requestKey: `assignees-${assignment.id}`
          })) as { publisher: string };
          notifySuccess(t("assignments.membersUpdated", "Members updated"));
          modal.resolve({
            holders: chosen.map(({ id, name }) => ({ id, name })),
            publisherName: response.publisher
          } satisfies ChangedAssignees);
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t("assignments.changeMembersTitle", "Who is this map given to?")}
            </DialogTitle>
            <DialogDescription>{assignment.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <MemberPicker
              members={members}
              onMap={{ map: assignment.mapId, link: assignment.id }}
              value={chosen}
              onValueChange={setChosen}
            />
            <DialogFooter>
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

export default ChangeAssignees;
