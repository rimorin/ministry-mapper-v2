import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import MemberPicker from "@/components/common/member-picker";
import { Button } from "@/components/ui/button";
import type { ProposalPerson } from "../../hooks/useAssistant";
import type { CongregationMember } from "../../utils/helpers/getcongregationmembers";
import { STEADY_HOVER } from "./assistant-shared";

interface AssistantLinkAccountsProps {
  people: ProposalPerson[];
  members: CongregationMember[];
  // The accounts the link will be given to, by user id.
  value: string[];
  onChange: (assignees: string[]) => void;
}

// The accounts a link card gives its map to. A name that fits one member
// arrives chosen, and the card says who it was taken to be; a name that fits
// several is offered beside them for the admin to choose.
const AssistantLinkAccounts = ({
  people,
  members,
  value,
  onChange
}: AssistantLinkAccountsProps) => {
  const { t } = useTranslation();
  const memberOf = (id: string) => members.find((member) => member.id === id);
  // Two members with one name are told apart by email, in the open: a
  // tooltip does not show on a phone.
  const labelOf = (member: CongregationMember) =>
    member.email &&
    members.some(
      (other) =>
        other.id !== member.id &&
        other.name.toLowerCase() === member.name.toLowerCase()
    )
      ? `${member.name} · ${member.email}`
      : member.name;
  // Picks made from less than the member's own name: the admin may mean
  // someone else, so the card says who each was taken to be.
  const taken = people.flatMap((person) => {
    const member =
      person.picked && value.includes(person.picked)
        ? memberOf(person.picked)
        : undefined;
    return member &&
      member.name.trim().toLowerCase() !== person.name.trim().toLowerCase()
      ? [{ name: person.name, member }]
      : [];
  });
  const offers = people
    .map((person) => ({
      name: person.name,
      members: [person.picked, ...(person.suggested ?? [])].flatMap((id) =>
        id && !value.includes(id) ? (memberOf(id) ?? []) : []
      )
    }))
    .filter((offer) => offer.members.length > 0);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground">
        {t("assistant.action.accounts", "Accounts")}
      </span>
      <MemberPicker
        members={members}
        value={value.flatMap((id) => memberOf(id) ?? [])}
        onValueChange={(chosen) => onChange(chosen.map((member) => member.id))}
        autoFocus={false}
      />
      {offers.map((offer) => (
        <div key={offer.name} className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground">
            {t("assistant.action.accountFor", "{{name}} may be", {
              name: offer.name
            })}
          </span>
          {offer.members.map((member) => (
            <Button
              key={member.id}
              type="button"
              variant="outline"
              size="xs"
              className={STEADY_HOVER}
              title={member.email || undefined}
              onClick={() => onChange([...value, member.id])}
            >
              <Plus />
              {labelOf(member)}
            </Button>
          ))}
        </div>
      ))}
      {taken.map(({ name, member }) => (
        <span key={name} className="text-muted-foreground">
          {t("assistant.action.accountIs", "{{name}} is {{account}}.", {
            name,
            account: labelOf(member)
          })}
        </span>
      ))}
      <p className="text-xs text-muted-foreground">
        {value.length > 0
          ? t(
              "assistant.action.accountsHint",
              "They are emailed and find the map under My Maps. Undo takes the map back, not the email."
            )
          : t(
              "assistant.action.accountsNone",
              "No account chosen, so you share the link yourself."
            )}
      </p>
    </div>
  );
};

export default AssistantLinkAccounts;
