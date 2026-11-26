import { lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Plus, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useModalManagement } from "../../hooks/useModalManagement";
import getCongregationMembers, {
  getCongregationGroups,
  namesOf,
  type CongregationGroup,
  type CongregationMember
} from "../../utils/helpers/getcongregationmembers";

const EditGroup = lazy(() => import("../modal/editgroup"));

const NEW_GROUP: CongregationGroup = { id: "", name: "", members: [] };

// The Groups tab of People: the congregation's groups, each opened to change.
const GroupList = ({ congregation }: { congregation: string }) => {
  const { t } = useTranslation();
  const { showModal } = useModalManagement();
  const [groups, setGroups] = useState<CongregationGroup[]>();
  const [members, setMembers] = useState<CongregationMember[]>();
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

  const edit = async (group: CongregationGroup) => {
    const changed = await showModal(EditGroup, {
      congregation,
      group,
      members: roster,
      taken: (groups ?? [])
        .filter((other) => other.id !== group.id)
        .map((other) => other.name)
    });
    if (changed) setVersion((current) => current + 1);
  };

  return (
    <>
      <p className="border-b px-4 py-3 text-sm text-muted-foreground">
        {t(
          "groups.description",
          "Narrow the member list to a group when you send someone a map."
        )}
      </p>
      {!groups || !members ? (
        <Spinner className="mx-auto my-10" />
      ) : groups.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tags aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t("groups.empty", "No groups yet")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "groups.emptyDescription",
                "Add your field service groups, a language group or visitors supporting the congregation."
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea className="min-h-0 flex-1" withFade>
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
                    className="flex-nowrap rounded-none border-0 text-left hover:bg-accent hover:text-accent-foreground"
                    render={
                      <button type="button" onClick={() => void edit(group)} />
                    }
                  >
                    <ItemContent className="min-w-0 gap-0">
                      <ItemTitle className="block w-full truncate text-base font-semibold">
                        {group.name}
                      </ItemTitle>
                      {people.length > 0 && (
                        <ItemDescription className="truncate">
                          {namesOf(people)}
                        </ItemDescription>
                      )}
                    </ItemContent>
                    <ItemActions className="shrink-0">
                      <Badge variant="secondary" className="tabular-nums">
                        <span aria-hidden="true">{group.members.length}</span>
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
      <div className="flex flex-col gap-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end">
        {!!groups?.length && ungrouped.length > 0 && (
          <p className="text-center text-sm text-muted-foreground sm:mr-auto sm:text-left">
            {t("groups.ungrouped", "{{count}} people aren't in a group", {
              count: ungrouped.length
            })}
          </p>
        )}
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => void edit(NEW_GROUP)}
        >
          <Plus aria-hidden="true" />
          {t("groups.new", "New group")}
        </Button>
      </div>
    </>
  );
};

export default GroupList;
