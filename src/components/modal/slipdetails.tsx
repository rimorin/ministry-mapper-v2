import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useState, FormEvent } from "react";
import { BookUser, Clock, MapPinned, TriangleAlert } from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import MapProgressStats from "@/components/common/map-progress-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from "@/components/common/responsive-dialog";
import { Calendar } from "@/components/ui/calendar";
import { USER_ACCESS_LEVELS, LINK_TYPES } from "../../utils/constants";
import GenericInputField from "../form/input";
import { ConfirmSlipDetailsModalProps } from "../../utils/interface";
import useNotification from "../../hooks/useNotification";
import useShareLink from "../../hooks/useShareLink";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import LinkTypeDescription from "../../utils/helpers/linkdesc";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import addHours from "../../utils/helpers/addhours";
import { createData } from "../../utils/pocketbase";
import ComponentAuthorizer from "../navigation/authorizer";

const MAX_ASSIGNEE_NAMES = 3;

const ConfirmSlipDetails = NiceModal.create(
  ({
    addressElement,
    policy,
    userId,
    isPersonalSlip = true,
    territoryName,
    existingLinks
  }: ConfirmSlipDetailsModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, notifyError, runAction } = useNotification();
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { shareLink, isSharing, shareButtonLabel } = useShareLink();
    const [linkExpiryHrs, setLinkExpiryHrs] = useState<number | undefined>();
    const [name, setName] = useState<string>("");
    const [isCreating, setIsCreating] = useState(false);
    const [createdLink, setCreatedLink] = useState<{
      linkId: string;
      message: string;
      linkType: string;
      expiryDate: string;
    } | null>(null);

    const { id: mapId, name: addressName, aggregates } = addressElement;

    const existingAssignmentRows = [
      LINK_TYPES.PERSONAL,
      LINK_TYPES.ASSIGNMENT
    ].map((linkType) => {
      const names = [
        ...new Set(
          existingLinks
            .filter((link) => link.publisherName && link.linkType === linkType)
            .map((link) => link.publisherName)
        )
      ];
      return {
        linkType,
        label: LinkTypeDescription(linkType),
        names: names.slice(0, MAX_ASSIGNEE_NAMES).join(", "),
        extraCount: Math.max(0, names.length - MAX_ASSIGNEE_NAMES)
      };
    });
    const existingRows = existingAssignmentRows.filter((row) => row.names);
    const showTypeBadges =
      existingRows.length > 1 ||
      existingRows[0]?.linkType === LINK_TYPES.PERSONAL;

    const handleSubmitDetails = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      if (!linkExpiryHrs && isPersonalSlip) {
        notifyWarning(t("slip.selectExpiryValidation"));
        return;
      }
      await runAction(
        async () => {
          const linkType = isPersonalSlip
            ? LINK_TYPES.PERSONAL
            : LINK_TYPES.ASSIGNMENT;
          const expiryHrs = linkExpiryHrs ?? policy.defaultExpiryHours;
          const expiryDate = addHours(expiryHrs);
          const linkRecord = await createData(
            "assignments",
            {
              map: mapId,
              user: userId,
              type: linkType,
              expiry_date: expiryDate,
              publisher: name,
              congregation: policy.congregation
            },
            {
              requestKey: `create-assignment-${mapId}-${userId}`
            }
          );
          setCreatedLink({
            linkId: linkRecord.id,
            message: assignmentMessage(addressName, name, expiryHrs, linkType),
            linkType,
            expiryDate
          });
        },
        { setLoading: setIsCreating }
      );
    };

    const handleShare = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      if (!createdLink) return;
      try {
        const result = await shareLink(createdLink);
        if (result === "cancelled") return;
        modal.hide();
      } catch (error) {
        notifyError(error);
      }
    };

    return (
      <ResponsiveDialog {...dialogProps}>
        <ResponsiveDialogContent {...contentProps}>
          {createdLink ? (
            <>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>
                  {t("slip.linkReadyTitle", "Map link is ready")}
                </ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <form onSubmit={handleShare} className="space-y-4">
                <div className="space-y-2 rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{addressName}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {LinkTypeDescription(createdLink.linkType)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {territoryName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPinned className="size-3 shrink-0" />
                        <span>{territoryName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookUser className="size-3 shrink-0" />
                      <span>
                        {t("assignments.assignedTo", "Assigned to")} {name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      <span>
                        {t("assignments.expires", "Expires")}{" "}
                        {LinkDateFormatter.format(
                          new Date(createdLink.expiryDate)
                        )}
                      </span>
                    </div>
                  </div>
                  {existingRows.length > 0 && (
                    <div className="space-y-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
                        <TriangleAlert className="size-3 shrink-0" />
                        <span>
                          {t("slip.alreadyAssigned", "Already assigned")}
                        </span>
                      </div>
                      {existingRows.map(
                        ({ linkType, label, names, extraCount }) => (
                          <div
                            key={`existing-${linkType}`}
                            className="flex items-start gap-1.5 text-xs"
                          >
                            {showTypeBadges && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 px-1.5 text-[10px]"
                              >
                                {label}
                              </Badge>
                            )}
                            <span className="min-w-0 pt-0.5 text-muted-foreground">
                              {names}
                              {extraCount > 0 && (
                                <span className="whitespace-nowrap font-medium text-amber-600 dark:text-amber-500">
                                  {" "}
                                  {t("slip.moreAssignees", "+{{count}} more", {
                                    count: extraCount
                                  })}
                                </span>
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {aggregates && (
                    <div className="border-t pt-2">
                      <MapProgressStats
                        size="sm"
                        notDone={aggregates.notDone}
                        notHome={aggregates.notHome}
                        progress={aggregates.display}
                      />
                    </div>
                  )}
                </div>
                <ResponsiveDialogFooter>
                  <Button variant="outline" type="button" onClick={modal.hide}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button type="submit" disabled={isSharing}>
                    {isSharing && (
                      <Spinner data-icon="inline-start" aria-hidden="true" />
                    )}
                    {shareButtonLabel}
                  </Button>
                </ResponsiveDialogFooter>
              </form>
            </>
          ) : (
            <>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>
                  {isPersonalSlip
                    ? t("slip.confirmPersonalTitle", { addressName })
                    : t("slip.confirmRegularTitle", { addressName })}
                </ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <form onSubmit={handleSubmitDetails} className="space-y-4">
                <div>
                  {isPersonalSlip && (
                    <Calendar
                      mode="single"
                      disabled={{
                        before: new Date(Date.now() + 3600 * 1000 * 24)
                      }}
                      onSelect={(selectedDate) => {
                        if (!selectedDate) return;
                        const expiryInHours = Math.floor(
                          (selectedDate.getTime() - new Date().getTime()) /
                            (1000 * 60 * 60)
                        );
                        setLinkExpiryHrs(expiryInHours);
                      }}
                      className="mb-1 w-full rounded-md border [--cell-size:--spacing(10)]"
                    />
                  )}
                  <GenericInputField
                    label={t("slip.publisherNameLabel")}
                    name="name"
                    handleChange={(event) => {
                      const { value } = event.target as HTMLInputElement;
                      setName(value);
                    }}
                    placeholder={t("slip.publisherNamePlaceholder")}
                    changeValue={name}
                    focus={true}
                    required={true}
                  />
                </div>
                <ResponsiveDialogFooter>
                  <Button variant="outline" type="button" onClick={modal.hide}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <ComponentAuthorizer
                    requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                    userPermission={policy.userRole}
                  >
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && (
                        <Spinner data-icon="inline-start" aria-hidden="true" />
                      )}
                      {t("slip.confirmButton")}
                    </Button>
                  </ComponentAuthorizer>
                </ResponsiveDialogFooter>
              </form>
            </>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }
);

export default ConfirmSlipDetails;
