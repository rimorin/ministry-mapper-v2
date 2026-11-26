import { useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search } from "lucide-react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import {
  Combobox,
  ComboboxActions,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import FilterChips from "./filter-chips";
import { getIsMobile } from "../../hooks/use-mobile";
import { STAFF_ROLES } from "../../utils/constants";
import { safeStorage } from "../../utils/safeStorage";
import { resolveLocalized } from "../../utils/resolveLocalized";
import {
  byName,
  type CongregationMember
} from "../../utils/helpers/getcongregationmembers";

const ROLE_LABELS: Record<string, string> = {
  administrator: "user.roles.administrator",
  conductor: "user.roles.conductor",
  read_only: "user.roles.readOnly"
};

interface MemberGroup {
  value: string;
  items: CongregationMember[];
}

interface MemberPickerProps {
  members: CongregationMember[];
  value: CongregationMember[];
  onValueChange: (chosen: CongregationMember[]) => void;
  // Members offered first, most recent first: the same few people are paired
  // up again and again in one sitting.
  recentIds?: string[];
  // Off where the picker sits in a page that has its own focus to keep.
  autoFocus?: boolean;
  // Whoever holds this map on another link is not offered it again.
  onMap?: { map: string; link?: string };
  // The phone panel's heading.
  title?: string;
  // Picks a group's members, not who a map goes to: one list by name with
  // each person's email, no map status or group chips, and the form lists
  // the people picked itself.
  roster?: boolean;
}

const ALL_GROUPS = "";
// The group last looked in, on this device: a conductor mostly sends their own.
const GROUP_KEY = "memberPicker.group";

const useMemberCombobox = ({
  members,
  value,
  onValueChange,
  recentIds = [],
  roster = false
}: MemberPickerProps) => {
  const { t } = useTranslation();
  // Base UI's own matching: ignores case and accents.
  const { contains } = ComboboxPrimitive.useFilter();
  const [query, setQuery] = useState("");
  const [chosenGroup, setChosenGroup] = useState(
    () => safeStorage.get(GROUP_KEY) ?? ALL_GROUPS
  );

  const groupNames = roster
    ? []
    : [...new Set(members.flatMap((member) => member.groups))].sort(byName);
  // A remembered group that is gone, or another congregation's, is All.
  const activeGroup = groupNames.includes(chosenGroup)
    ? chosenGroup
    : ALL_GROUPS;
  const inGroup = (member: CongregationMember) =>
    activeGroup === ALL_GROUPS || member.groups.includes(activeGroup);
  const matches = (member: CongregationMember, search: string) =>
    contains(member.name, search) || contains(member.email, search);
  // The search and the group apply together, as in the members list, and each
  // chip counts the people the search found in it.
  const found = members.filter((member) => matches(member, query));
  const chooseGroup = (next: string) => {
    setChosenGroup(next);
    safeStorage.set(GROUP_KEY, next);
  };
  const groups = {
    chips:
      groupNames.length === 0
        ? []
        : [
            {
              value: ALL_GROUPS,
              label: t("common.all", "All"),
              count: found.length
            },
            ...groupNames.map((name) => ({
              value: name,
              label: name,
              count: found.filter((member) => member.groups.includes(name))
                .length
            }))
          ],
    value: activeGroup,
    onValueChange: chooseGroup,
    // Everyone the search found is in other groups.
    elsewhere:
      activeGroup !== ALL_GROUPS && found.length > 0 && !found.some(inGroup),
    // With no group chosen, each row says which ones its person is in.
    withGroups: groupNames.length > 0 && activeGroup === ALL_GROUPS
  };

  const recentMembers = recentIds.flatMap(
    (id) => members.find((member) => member.id === id && inGroup(member)) ?? []
  );
  const others = members.filter(
    (member) => !recentIds.includes(member.id) && inGroup(member)
  );
  const items: MemberGroup[] = (
    roster
      ? [{ value: "", items: members }]
      : [
          {
            value: t("slip.recentMembers", "Recently assigned"),
            items: recentMembers
          },
          {
            value: t("slip.freeMembers", "Without a map"),
            items: others.filter((member) => member.maps.length === 0)
          },
          {
            value: t("slip.busyMembers", "Working a map"),
            items: others.filter((member) => member.maps.length > 0)
          }
        ]
  ).filter((group) => group.items.length > 0);

  return {
    combobox: {
      multiple: true,
      autoHighlight: true,
      items,
      value,
      onValueChange,
      inputValue: query,
      onInputValueChange: setQuery,
      itemToStringLabel: (member: CongregationMember) => member.name,
      filter: matches,
      isItemEqualToValue: (a: CongregationMember, b: CongregationMember) =>
        a.id === b.id
    } as const,
    groups
  };
};

type GroupFilter = ReturnType<typeof useMemberCombobox>["groups"];

// Tapping a chip keeps the search focused, and on a phone the keyboard up.
const keepFocus = (event: MouseEvent) => event.preventDefault();

const GroupChips = ({
  groups,
  className
}: {
  groups: GroupFilter;
  className?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div onMouseDown={keepFocus}>
      <FilterChips
        chips={groups.chips}
        value={groups.value}
        onValueChange={groups.onValueChange}
        aria-label={t("groups.filter", "Filter by group")}
        className={className}
      />
    </div>
  );
};

const NoMatch = ({ groups }: { groups: GroupFilter }) => {
  const { t } = useTranslation();
  if (!groups.elsewhere) return t("common.noResults", "No results found.");
  return (
    <span className="flex flex-col items-center gap-3">
      {t("groups.noneInGroup", "No one in {{group}} matches.", {
        group: groups.value
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onMouseDown={keepFocus}
        onClick={() => groups.onValueChange(ALL_GROUPS)}
      >
        {t("groups.searchAll", "Search all groups")}
      </Button>
    </span>
  );
};

const MemberList = ({
  members,
  onMap,
  className,
  roomy = false,
  withGroups = false,
  roster = false
}: Pick<MemberPickerProps, "members" | "onMap" | "roster"> & {
  className?: string;
  roomy?: boolean;
  // Each row also says which groups its person is in.
  withGroups?: boolean;
}) => {
  const { t, i18n } = useTranslation();
  // An email is shown only to tell two people of one name apart.
  const names = members.map((member) => member.name);
  const isShared = (name: string) =>
    names.indexOf(name) !== names.lastIndexOf(name);

  return (
    <ComboboxList className={className}>
      {(group: MemberGroup) => (
        <ComboboxGroup key={group.value} items={group.items}>
          {group.value && (
            <ComboboxLabel
              className={cn(roomy && "sticky top-0 z-10 bg-popover px-4 py-2")}
            >
              {group.value}
            </ComboboxLabel>
          )}
          <ComboboxCollection>
            {(member: CongregationMember) => {
              const isOnMap = member.maps.some(
                (held) => held.map === onMap?.map && held.link !== onMap.link
              );
              const mapNames = member.maps
                .map((held) => resolveLocalized(held.name, i18n.language))
                .filter(Boolean)
                .join(", ");
              const mapCount = t("slip.memberMapCount", "{{count}} maps", {
                count: member.maps.length
              });
              const holding =
                member.maps.length === 0
                  ? t("slip.memberNoMap", "No map assigned")
                  : member.maps.length === 1
                    ? mapNames || mapCount
                    : [mapCount, mapNames].filter(Boolean).join(": ");
              const tag = isOnMap
                ? t("slip.memberOnThisMap", "Already working this map")
                : STAFF_ROLES.includes(member.role)
                  ? t(ROLE_LABELS[member.role])
                  : "";
              return (
                // Not the registry item: its tick appears only once chosen and shifts the name.
                // data-[selected], not shadcn's data-selected, which waits for ="true":
                // Base UI sets the attribute bare.
                <ComboboxPrimitive.Item
                  key={member.id}
                  value={member}
                  disabled={isOnMap}
                  className={cn(
                    "group/member cursor-default rounded-md px-3 py-2 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-[selected]:bg-primary/5",
                    roomy && "px-4 py-3"
                  )}
                >
                  <Item size="xs" className="flex-nowrap gap-3 p-0">
                    <ItemMedia
                      aria-hidden="true"
                      className="size-5 self-center rounded-full border border-input text-primary-foreground group-data-[selected]/member:border-primary group-data-[selected]/member:bg-primary"
                    >
                      <Check className="size-3.5 opacity-0 group-data-[selected]/member:opacity-100" />
                    </ItemMedia>
                    <ItemContent className="min-w-0 gap-0">
                      <ItemTitle className={cn("w-full", roomy && "text-base")}>
                        <span className="truncate">{member.name}</span>
                      </ItemTitle>
                      <ItemDescription
                        className={cn("truncate", !roomy && "text-xs")}
                      >
                        {roster
                          ? member.email
                          : [
                              isShared(member.name) && member.email,
                              holding,
                              withGroups && member.groups.join(", ")
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                      </ItemDescription>
                    </ItemContent>
                    {tag && (
                      <ItemActions className="shrink-0">
                        <Badge variant="outline">{tag}</Badge>
                      </ItemActions>
                    )}
                  </Item>
                </ComboboxPrimitive.Item>
              );
            }}
          </ComboboxCollection>
        </ComboboxGroup>
      )}
    </ComboboxList>
  );
};

const MemberPopup = (props: MemberPickerProps) => {
  const { members, value, onMap, autoFocus = true, roster = false } = props;
  const { t } = useTranslation();
  const label = t("slip.memberPlaceholder", "Search members");
  // The list stays open while several people are picked and covers the rest
  // of the form, so it carries its own way out.
  const [open, setOpen] = useState(false);
  const { combobox, groups } = useMemberCombobox(props);

  return (
    <Combobox {...combobox} open={open} onOpenChange={setOpen}>
      <ComboboxInputGroup className="h-auto min-h-9">
        {roster ? (
          // Without chips, so Backspace never takes out someone unseen.
          <ComboboxInput
            autoFocus={autoFocus}
            placeholder={label}
            aria-label={label}
          />
        ) : (
          <ComboboxChips>
            {value.map((member) => (
              <ComboboxChip
                key={member.id}
                aria-label={member.name}
                title={member.email || undefined}
              >
                {member.name}
              </ComboboxChip>
            ))}
            <ComboboxChipsInput
              autoFocus={autoFocus}
              // Kept once people are picked: it is still where to search.
              placeholder={label}
              aria-label={label}
            />
          </ComboboxChips>
        )}
        <ComboboxActions>
          <ComboboxTrigger />
        </ComboboxActions>
      </ComboboxInputGroup>
      <ComboboxContent className="flex flex-col overflow-hidden pb-0">
        {groups.chips.length > 0 && (
          <div className="shrink-0 border-b py-1.5">
            <GroupChips groups={groups} className="px-1.5" />
          </div>
        )}
        <ComboboxEmpty className="py-4 text-center">
          <NoMatch groups={groups} />
        </ComboboxEmpty>
        <MemberList
          members={members}
          onMap={onMap}
          withGroups={groups.withGroups}
          roster={roster}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1"
        />
        <div className="shrink-0 border-t p-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            {t("common.done", "Done")}
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  );
};

// On a phone the keyboard leaves a floating list too little room.
const MemberSheet = (props: MemberPickerProps) => {
  const { members, value, onMap, roster = false, title } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const shown = roster ? [] : value;
  const inputRef = useRef<HTMLInputElement>(null);
  const { combobox, groups } = useMemberCombobox(props);
  const label = t("slip.memberPlaceholder", "Search members");

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center gap-1 rounded-md border border-input bg-transparent py-1.5 pr-3 pl-2 text-left text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {shown.length === 0 ? (
            <span className="px-1 text-muted-foreground">{label}</span>
          ) : (
            shown.map((member) => (
              <span
                key={member.id}
                className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-sm font-medium"
              >
                {member.name}
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerPrimitive.VirtualKeyboardProvider>
          <DrawerContent initialFocus={inputRef} className="h-dvh">
            {/* Bound to the panel's open state so the search resets on close. */}
            {/* On a phone a highlighted first row reads as already chosen. */}
            <Combobox {...combobox} autoHighlight={false} inline open={open}>
              <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
                <DrawerTitle className="text-lg font-semibold">
                  {title ?? t("slip.memberLabel", "Send to their account")}
                </DrawerTitle>
                {/* Not "Done": the form it returns to still has to be sent. */}
                <Button type="button" onClick={() => setOpen(false)}>
                  {t("common.continue", "Continue")}
                  {value.length > 0 && ` (${value.length})`}
                </Button>
              </div>
              <div className="shrink-0 space-y-2 px-4 py-3">
                <ComboboxInputGroup className="h-11">
                  <Search
                    className="ml-3 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <ComboboxInput
                    ref={inputRef}
                    aria-label={label}
                    placeholder={label}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="search"
                    className="pr-3 pl-2 text-base"
                  />
                </ComboboxInputGroup>
                {groups.chips.length > 0 && (
                  <GroupChips groups={groups} className="-mx-4 px-4" />
                )}
                {shown.length > 0 && (
                  <ComboboxChips className="flex-nowrap overflow-x-auto p-0">
                    {shown.map((member) => (
                      <ComboboxChip
                        key={member.id}
                        aria-label={member.name}
                        className="h-8 max-w-none shrink-0 rounded-md text-sm"
                      >
                        {member.name}
                      </ComboboxChip>
                    ))}
                  </ComboboxChips>
                )}
              </div>
              <ComboboxEmpty className="py-10 text-center text-sm">
                <NoMatch groups={groups} />
              </ComboboxEmpty>
              <MemberList
                members={members}
                onMap={onMap}
                withGroups={groups.withGroups}
                roster={roster}
                roomy
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain border-t pb-4",
                  // The list ends at the keyboard's top. Run on behind it, a
                  // row picked there counts as in view, and iOS Safari pans
                  // the whole page up to show it, taking the search with it.
                  "mb-[var(--drawer-keyboard-inset,0px)]"
                )}
              />
            </Combobox>
          </DrawerContent>
        </DrawerPrimitive.VirtualKeyboardProvider>
      </Drawer>
    </>
  );
};

// Picks the congregation members a link is given to, by name or email.
const MemberPicker = (props: MemberPickerProps) => {
  // Latched per mount, as the dialogs around it are.
  const [isSheet] = useState(getIsMobile);
  return isSheet ? <MemberSheet {...props} /> : <MemberPopup {...props} />;
};

export default MemberPicker;
