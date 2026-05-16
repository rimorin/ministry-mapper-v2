import NiceModal from "@ebay/nice-modal-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  Trash2,
  Clock,
  CalendarCheck,
  BookUser,
  UserCog
} from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import LinkTypeDescription from "../../utils/helpers/linkdesc";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import type { LinkSession } from "../../utils/policies";
import type { AssignmentModalProps } from "../../utils/interface";
import { deleteDataById } from "../../utils/pocketbase";
import useNotification from "../../hooks/useNotification";

const GetAssignments = NiceModal.create(
  ({
    assignments,
    assignmentType,
    assignmentTerritory
  }: AssignmentModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { t } = useTranslation();
    const { runAction } = useNotification();

    const [currentAssignments, setCurrentAssignments] =
      useState<LinkSession[]>(assignments);

    const deleteAssignment = async (linkid: string) => {
      await deleteDataById("assignments", linkid, {
        requestKey: `assignment-delete-${linkid}`
      });
    };

    useEffect(() => {
      if (currentAssignments.length === 0) {
        modal.hide();
      }
      // eslint-disable-next-line @eslint-react/exhaustive-deps -- modal is a stable reference from useModal
    }, [currentAssignments]);

    const isAssignOrPersonalAssignments = assignmentType && assignmentTerritory;

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {isAssignOrPersonalAssignments
                ? t(
                    "assignment.linkWithTerritory",
                    "{{territory}} {{type}} Links",
                    {
                      territory: assignmentTerritory,
                      type: LinkTypeDescription(assignmentType)
                    }
                  )
                : t("assignment.assignments", "Assignments")}
            </DialogTitle>
            <DialogDescription>
              {currentAssignments.length}{" "}
              {currentAssignments.length === 1
                ? t("assignment.activeLink", "active link")
                : t("assignment.activeLinks", "active links")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ScrollArea className="max-h-[40dvh]">
            <ul className="m-0 list-none space-y-2 p-0">
              {currentAssignments.map((assignment) => (
                <li
                  key={`assignment-${assignment.id}`}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`map/${assignment.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        {isAssignOrPersonalAssignments
                          ? t("assignment.link", "Link")
                          : assignment.name}
                      </a>
                      {!isAssignOrPersonalAssignments &&
                        assignment.linkType && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5"
                          >
                            {LinkTypeDescription(assignment.linkType)}
                          </Badge>
                        )}
                    </div>

                    <div className="space-y-1">
                      {assignment.assignerName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserCog className="size-3 shrink-0" />
                          <span>
                            {t("assignments.assignedBy")}{" "}
                            {assignment.assignerName}
                          </span>
                        </div>
                      )}
                      {assignment.publisherName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookUser className="size-3 shrink-0" />
                          <span>
                            {t("assignments.assignedTo")}{" "}
                            {assignment.publisherName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarCheck className="size-3 shrink-0" />
                        <span>
                          {t("assignments.created", "Created")}{" "}
                          {LinkDateFormatter.format(
                            new Date(assignment.tokenCreatetime)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        <span>
                          {t("assignments.expires", "Expires")}{" "}
                          {LinkDateFormatter.format(
                            new Date(assignment.tokenEndtime)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      await runAction(async () => {
                        await deleteAssignment(assignment.id);
                        setCurrentAssignments((prev) =>
                          prev.filter((a) => a.id !== assignment.id)
                        );
                      });
                    }}
                    aria-label={t("common.delete", "Delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <Separator />
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => modal.hide()}
            >
              {t("common.close", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default GetAssignments;
