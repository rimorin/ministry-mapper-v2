import { useTranslation } from "react-i18next";
import { Map as MapIcon } from "lucide-react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
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
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger
} from "@/components/ui/combobox";
import type { CongregationMember } from "../../utils/helpers/getcongregationmembers";

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
}

// Picks the congregation members a link is given to, by name or email.
const MemberPicker = ({
  members,
  value,
  onValueChange,
  recentIds = [],
  autoFocus = true
}: MemberPickerProps) => {
  const { t } = useTranslation();
  // Base UI's own matching: ignores case and accents.
  const { contains } = ComboboxPrimitive.useFilter();

  const recentMembers = recentIds.flatMap(
    (id) => members.find((member) => member.id === id) ?? []
  );
  const memberGroups: MemberGroup[] = [
    { value: t("slip.recentMembers", "Recent"), items: recentMembers },
    {
      value: t("slip.allMembers", "Members"),
      items: members.filter((member) => !recentIds.includes(member.id))
    }
  ].filter((group) => group.items.length > 0);

  return (
    <Combobox
      multiple
      autoHighlight
      items={memberGroups}
      value={value}
      itemToStringLabel={(member: CongregationMember) => member.name}
      filter={(member: CongregationMember, query) =>
        contains(member.name, query) || contains(member.email, query)
      }
      isItemEqualToValue={(a: CongregationMember, b: CongregationMember) =>
        a.id === b.id
      }
      onValueChange={onValueChange}
    >
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
      <ComboboxContent>
        <ComboboxEmpty>
          {t("common.noResults", "No results found.")}
        </ComboboxEmpty>
        <ComboboxList>
          {(group: MemberGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(member: CongregationMember) => (
                  <ComboboxItem key={member.id} value={member}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{member.name}</span>
                      {member.email && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </span>
                    {member.openLinks > 0 && (
                      <span
                        className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                        aria-label={t(
                          "slip.memberOpenLinks",
                          "Open maps: {{count}}",
                          { count: member.openLinks }
                        )}
                      >
                        <MapIcon className="size-3" />
                        {member.openLinks}
                      </span>
                    )}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default MemberPicker;
