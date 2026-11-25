import { useRef, useState } from "react";
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
import { getIsMobile } from "../../hooks/use-mobile";
import { STAFF_ROLES } from "../../utils/constants";
import { resolveLocalized } from "../../utils/resolveLocalized";
import type { CongregationMember } from "../../utils/helpers/getcongregationmembers";

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
}

const useMemberCombobox = ({
  members,
  value,
  onValueChange,
  recentIds = []
}: MemberPickerProps) => {
  const { t } = useTranslation();
  // Base UI's own matching: ignores case and accents.
  const { contains } = ComboboxPrimitive.useFilter();

  const recentMembers = recentIds.flatMap(
    (id) => members.find((member) => member.id === id) ?? []
  );
  const others = members.filter((member) => !recentIds.includes(member.id));
  const items: MemberGroup[] = [
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
  ].filter((group) => group.items.length > 0);

  return {
    multiple: true,
    autoHighlight: true,
    items,
    value,
    onValueChange,
    itemToStringLabel: (member: CongregationMember) => member.name,
    filter: (member: CongregationMember, query: string) =>
      contains(member.name, query) || contains(member.email, query),
    isItemEqualToValue: (a: CongregationMember, b: CongregationMember) =>
      a.id === b.id
  } as const;
};

const MemberList = ({
  members,
  onMap,
  className,
  roomy = false
}: Pick<MemberPickerProps, "members" | "onMap"> & {
  className?: string;
  roomy?: boolean;
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
          <ComboboxLabel
            className={cn(roomy && "sticky top-0 z-10 bg-popover px-4 py-2")}
          >
            {group.value}
          </ComboboxLabel>
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
                <ComboboxPrimitive.Item
                  key={member.id}
                  value={member}
                  disabled={isOnMap}
                  className={cn(
                    "group/member cursor-default rounded-md px-3 py-2 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-selected:bg-primary/5",
                    roomy && "px-4 py-3"
                  )}
                >
                  <Item size="xs" className="flex-nowrap gap-3 p-0">
                    <ItemMedia
                      aria-hidden="true"
                      className="size-5 self-center rounded-full border border-input text-primary-foreground group-data-selected/member:border-primary group-data-selected/member:bg-primary"
                    >
                      <Check className="size-3.5 opacity-0 group-data-selected/member:opacity-100" />
                    </ItemMedia>
                    <ItemContent className="min-w-0 gap-0">
                      <ItemTitle className={cn("w-full", roomy && "text-base")}>
                        <span className="truncate">{member.name}</span>
                      </ItemTitle>
                      <ItemDescription
                        className={cn("truncate", !roomy && "text-xs")}
                      >
                        {isShared(member.name) && member.email
                          ? `${member.email} · ${holding}`
                          : holding}
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
  const { members, value, onMap, autoFocus = true } = props;
  const { t } = useTranslation();
  // The list stays open while several people are picked and covers the rest
  // of the form, so it carries its own way out.
  const [open, setOpen] = useState(false);
  const combobox = useMemberCombobox(props);

  return (
    <Combobox {...combobox} open={open} onOpenChange={setOpen}>
      <ComboboxInputGroup className="h-auto min-h-9">
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
            placeholder={
              value.length > 0
                ? undefined
                : t("slip.memberPlaceholder", "Search members")
            }
            aria-label={t("slip.memberPlaceholder", "Search members")}
          />
        </ComboboxChips>
        <ComboboxActions>
          <ComboboxTrigger />
        </ComboboxActions>
      </ComboboxInputGroup>
      <ComboboxContent className="flex flex-col overflow-hidden pb-0">
        <ComboboxEmpty>
          {t("common.noResults", "No results found.")}
        </ComboboxEmpty>
        <MemberList
          members={members}
          onMap={onMap}
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
  const { members, value, onMap } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const combobox = useMemberCombobox(props);
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
          {value.length === 0 ? (
            <span className="px-1 text-muted-foreground">{label}</span>
          ) : (
            value.map((member) => (
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
                  {t("slip.memberLabel", "Send to their account")}
                </DrawerTitle>
                <Button type="button" onClick={() => setOpen(false)}>
                  {t("common.done", "Done")}
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
                {value.length > 0 && (
                  <ComboboxChips className="flex-nowrap overflow-x-auto p-0">
                    {value.map((member) => (
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
                {t("common.noResults", "No results found.")}
              </ComboboxEmpty>
              <MemberList
                members={members}
                onMap={onMap}
                roomy
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain border-t",
                  // Ends above the keyboard, so the last people can be reached.
                  "pb-[calc(var(--drawer-keyboard-inset,0px)+1rem)]"
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
