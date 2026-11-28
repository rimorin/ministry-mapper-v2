import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState, FormEvent } from "react";
import { BookUser, Clock, MapPinned, TriangleAlert } from "lucide-react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import MapProgressStats from "@/components/common/map-progress-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SubmitButton from "../common/submit-button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from "@/components/common/responsive-dialog";
import { Calendar } from "@/components/ui/calendar";
import MemberPicker from "@/components/common/member-picker";
import usePublisherRoleEnabled from "../../hooks/usePublisherRoleEnabled";
import { Label } from "@/components/ui/label";
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
import {
  CongregationMember,
  heldLinks,
  loadCongregationMembers,
  namesBesides,
  namesOf,
  newlyHeld
} from "../../utils/helpers/getcongregationmembers";
import { resolveLocalized } from "../../utils/resolveLocalized";

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
    const { t, i18n } = useTranslation();
    const { notifyWarning, notifyError, notifySuccess, runAction } =
      useNotification();
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { shareLink, isSharing, shareButtonLabel } = useShareLink();
    const [linkExpiryHrs, setLinkExpiryHrs] = useState<number | undefined>();
    // What is typed: every name where links are not given to accounts, and
    // otherwise only the people who have no account.
    const [name, setName] = useState<string>("");
    const [isCreating, setIsCreating] = useState(false);
    const [members, setMembers] = useState<CongregationMember[]>([]);
    const [assignees, setAssignees] = useState<CongregationMember[]>([]);
    // Maps the people picked were given by someone else while this dialog was
    // open, found on Confirm.
    const [justGiven, setJustGiven] = useState<ReturnType<typeof newlyHeld>>(
      []
    );
    // Who this dialog has seen on which link; null until a load brings the
    // links, since a roster without them cannot say what is new.
    const [seenLinks, setSeenLinks] = useState<Set<string> | null>(null);
    const chooseAssignees = (next: CongregationMember[]) => {
      setAssignees(next);
      setJustGiven([]);
    };

    const isPublisherRoleEnabled = usePublisherRoleEnabled();

    // Giving the link to members is optional, so a roster that fails to load
    // only leaves the picker out, as the role being switched off does.
    useEffect(() => {
      if (!policy.congregation || !isPublisherRoleEnabled) return;
      loadCongregationMembers(policy.congregation)
        .then((loaded) => {
          setMembers(loaded.members);
          if (loaded.linksLoaded) setSeenLinks(heldLinks(loaded.members));
        })
        .catch(() => {});
    }, [policy.congregation, isPublisherRoleEnabled]);
    const [createdLink, setCreatedLink] = useState<{
      linkId: string;
      message: string;
      linkType: string;
      expiryDate: string;
      // Set when some of the link's people got it on their account: who they
      // are, and who is left to send it to.
      given?: string;
      others?: string;
    } | null>(null);

    const { id: mapId, name: addressName, aggregates } = addressElement;
    // The people typed in who have no account, and the names the link
    // carries: its members', then theirs.
    const others = namesBesides(name, assignees);
    const publisherText = [namesOf(assignees), ...others]
      .filter(Boolean)
      .join(", ");
    const peopleCount = assignees.length + others.length;

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
          // The list may be minutes old: another conductor could have given
          // these people a map since. Each Confirm checks again; a check that
          // fails, or comes without the links, never stops the link.
          if (assignees.length > 0) {
            const fresh = await loadCongregationMembers(
              policy.congregation,
              "-check"
            ).catch(() => null);
            if (fresh?.linksLoaded) {
              const given = seenLinks
                ? newlyHeld(assignees, fresh.members, seenLinks)
                : [];
              setMembers(fresh.members);
              setSeenLinks(heldLinks(fresh.members));
              if (given.length > 0) {
                // Given this very map: a second link to it would be a
                // duplicate, so they come off the list of people chosen.
                const takenOff = given
                  .filter(({ maps }) => maps.some((held) => held.map === mapId))
                  .map(({ id }) => id);
                setAssignees((chosen) =>
                  chosen.filter((member) => !takenOff.includes(member.id))
                );
                setJustGiven(given);
                return;
              }
            }
          }
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
              publisher: publisherText,
              congregation: policy.congregation,
              ...(assignees.length > 0 && {
                assignees: assignees.map((member) => member.id)
              })
            },
            {
              requestKey: `create-assignment-${mapId}-${userId}`
            }
          );
          if (assignees.length > 0) {
            notifySuccess(
              t("slip.givenTo", "Given to {{names}}", {
                names: namesOf(assignees)
              })
            );
            // Members find the map under My Maps, so there is nothing to
            // send them. Anyone typed in beside them has no account to find
            // it under, and still needs the link.
            if (others.length === 0) {
              modal.hide();
              return;
            }
            setCreatedLink({
              linkId: linkRecord.id,
              message: assignmentMessage(
                addressName,
                others.join(", "),
                expiryHrs,
                linkType
              ),
              linkType,
              expiryDate,
              given: namesOf(assignees),
              others: others.join(", ")
            });
            return;
          }
          setCreatedLink({
            linkId: linkRecord.id,
            message: assignmentMessage(
              addressName,
              publisherText,
              expiryHrs,
              linkType
            ),
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

    const existingWarning = existingRows.length > 0 && (
      <div className="space-y-1.5 rounded-md border border-warning/30 bg-warning/10 p-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
          <TriangleAlert className="size-3 shrink-0" />
          <span>{t("slip.alreadyAssigned", "Already assigned")}</span>
        </div>
        {existingRows.map(({ linkType, label, names, extraCount }) => (
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
                <span className="whitespace-nowrap font-medium text-warning">
                  {" "}
                  {t("slip.moreAssignees", "+{{count}} more", {
                    count: extraCount
                  })}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );

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
                        {t("assignments.assignedTo", "Assigned to")}{" "}
                        {publisherText}
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
                  {createdLink.others && (
                    <p className="rounded-md border border-info/30 bg-info/10 p-2 text-xs">
                      {t(
                        "slip.shareWithOthers",
                        "{{given}} will find it under My Maps. Share the link with {{others}}.",
                        {
                          given: createdLink.given,
                          others: createdLink.others
                        }
                      )}
                    </p>
                  )}
                  {existingWarning}
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
                <ResponsiveDialogFooter className="grid grid-cols-2 md:flex">
                  <Button variant="outline" type="button" onClick={modal.hide}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <SubmitButton pending={isSharing}>
                    {shareButtonLabel}
                  </SubmitButton>
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
                  {members.length > 0 && (
                    <>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {t(
                          "slip.whoHint",
                          "Fill in one or both, for the publishers working this map."
                        )}
                      </p>
                      <div className="mb-3 space-y-1.5">
                        <Label>
                          {t("slip.memberLabel", "Send to their account")}
                        </Label>
                        <MemberPicker
                          members={members}
                          value={assignees}
                          onValueChange={chooseAssignees}
                          onMap={{ map: mapId }}
                        />
                        {assignees.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {t(
                              "slip.memberHint",
                              "They will find this map under My Maps."
                            )}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  {/* With accounts on offer the two kinds of people get a box
                      each, so nothing has to be worked out from what is
                      typed. */}
                  <GenericInputField
                    label={
                      members.length > 0
                        ? t("slip.othersLabel", "Others without an account")
                        : t("slip.publisherNameLabel")
                    }
                    name="name"
                    handleChange={(event) => {
                      const { value } = event.target as HTMLInputElement;
                      setName(value);
                    }}
                    placeholder={
                      members.length > 0
                        ? t(
                            "slip.othersPlaceholder",
                            "Names, separated by commas"
                          )
                        : t("slip.publisherNamePlaceholder")
                    }
                    changeValue={name}
                    focus={members.length === 0}
                    // Someone has to be on the link.
                    required={assignees.length === 0}
                  />
                  {assignees.length > 0 && others.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t(
                        "slip.othersHint",
                        "You will be given a link to send them."
                      )}
                    </p>
                  )}
                </div>
                {assignees.length > 0 && existingWarning}
                {justGiven.length > 0 && (
                  <div
                    role="alert"
                    className="space-y-1 rounded-md border border-warning/30 bg-warning/10 p-2 text-xs"
                  >
                    {justGiven.map(({ id, name: person, maps }) => (
                      <p key={id} className="flex items-start gap-1.5">
                        <TriangleAlert className="mt-0.5 size-3 shrink-0 text-warning" />
                        {maps.some((held) => held.map === mapId)
                          ? t(
                              "slip.justGivenThisMap",
                              "{{name}} was just given this map, so is no longer chosen.",
                              { name: person }
                            )
                          : t(
                              "slip.justGiven",
                              "{{name}} was just given {{maps}}.",
                              {
                                name: person,
                                maps:
                                  maps
                                    .map((held) =>
                                      resolveLocalized(held.name, i18n.language)
                                    )
                                    .filter(Boolean)
                                    .join(", ") ||
                                  t("slip.memberMapCount", "{{count}} maps", {
                                    count: maps.length
                                  })
                              }
                            )}
                      </p>
                    ))}
                  </div>
                )}
                <ResponsiveDialogFooter className="grid grid-cols-2 md:flex">
                  <Button variant="outline" type="button" onClick={modal.hide}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <ComponentAuthorizer
                    requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                    userPermission={policy.userRole}
                  >
                    <SubmitButton pending={isCreating}>
                      {justGiven.some(({ id }) =>
                        assignees.some((member) => member.id === id)
                      )
                        ? t("slip.confirmAnyway", "Confirm anyway")
                        : assignees.length > 0
                          ? t("slip.confirmCount", "Confirm ({{count}})", {
                              count: peopleCount
                            })
                          : t("slip.confirmButton")}
                    </SubmitButton>
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
