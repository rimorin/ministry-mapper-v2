import { useEffect, useState } from "react";
import { ChevronRight, Search, SearchX, UserPlus } from "lucide-react";
import ListPanel from "@/components/common/list-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterChips from "@/components/common/filter-chips";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from "@/components/ui/item";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { UserListingProps } from "../../utils/interface";
import {
  getCongregationGroups,
  type CongregationGroup
} from "../../utils/helpers/getcongregationmembers";
import UserRoleBadge from "./rolebadge";
import GroupList from "./grouplist";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ALL_ROLES = "all";

// The order roles are listed and offered as filters in, most access first.
const ROLE_FILTERS = [
  { code: USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE, key: "administrator" },
  { code: USER_ACCESS_LEVELS.CONDUCTOR.CODE, key: "conductor" },
  { code: USER_ACCESS_LEVELS.PUBLISHER.CODE, key: "publisher" },
  { code: USER_ACCESS_LEVELS.READ_ONLY.CODE, key: "readOnly" }
];

const roleRank = (role: string) => {
  const rank = ROLE_FILTERS.findIndex((filter) => filter.code === role);
  return rank === -1 ? ROLE_FILTERS.length : rank;
};

// Its own component so the search and the role chosen start afresh each time
// the sheet opens: the sheet's content unmounts when it closes.
const UserList = ({
  handleSelect,
  users = [],
  people
}: Pick<UserListingProps, "handleSelect" | "users" | "people">) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState(ALL_ROLES);
  const [groups, setGroups] = useState<CongregationGroup[]>([]);
  // Bumped once a member's dialog or an invite is done with, to read the
  // groups again.
  const [version, setVersion] = useState(0);

  // In People, rows show each person's groups, read again whenever the tab
  // opens so a change made on the Groups tab shows.
  const congregation = people?.congregation;
  useEffect(() => {
    if (!congregation) return;
    getCongregationGroups(congregation, `people-groups-${congregation}`)
      .then(setGroups)
      .catch(() => {});
  }, [congregation, version]);
  const groupsOf = (userId: string) =>
    groups.filter((group) => group.members.includes(userId));

  const needle = query.trim().toLowerCase();
  // By role, then by name: the staff stay together at the top however many
  // publishers there are, and a name is found by eye within its role.
  const matched = users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle)
    )
    .sort(
      (a, b) =>
        roleRank(a.role) - roleRank(b.role) || a.name.localeCompare(b.name)
    );
  // Counted after the search, so each role says how many of the people found
  // hold it. Roles nobody holds are left out.
  const roles = ROLE_FILTERS.map((filter) => ({
    ...filter,
    count: matched.filter((user) => user.role === filter.code).length,
    held: users.some((user) => user.role === filter.code)
  })).filter((filter) => filter.held);
  const visible =
    role === ALL_ROLES ? matched : matched.filter((user) => user.role === role);

  return (
    <>
      <div className="flex flex-col gap-2 border-b px-4 py-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("user.searchNameOrEmail", "Search name or email")}
            aria-label={t("user.searchNameOrEmail", "Search name or email")}
          />
        </InputGroup>
        {/* With one role held there is nothing to narrow down. */}
        {roles.length > 1 && (
          <FilterChips
            className="-mx-4 px-4"
            chips={[
              {
                value: ALL_ROLES,
                label: t("user.allRoles", "All"),
                count: matched.length
              },
              ...roles.map(({ code, key, count }) => ({
                value: code,
                label: t(`user.roles.${key}`),
                count
              }))
            ]}
            value={role}
            onValueChange={setRole}
            aria-label={t("user.filterByRole", "Filter by role")}
          />
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1" withFade>
        {visible.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {t("common.noResults", "No results found.")}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-0">
            {visible.map((element) => (
              <div
                key={`list-group-item-${element.roleId}`}
                role="listitem"
                className="border-b last:border-b-0"
              >
                <Item
                  className="flex-nowrap rounded-none border-0 text-left hover:bg-accent hover:text-accent-foreground"
                  render={
                    <button
                      type="button"
                      onClick={async (e) => {
                        await handleSelect?.(element.roleId, e);
                        if (people) setVersion((current) => current + 1);
                      }}
                    />
                  }
                >
                  <ItemContent className="min-w-0 gap-0">
                    <ItemTitle className="block w-full truncate text-base font-semibold">
                      {element.name}
                    </ItemTitle>
                    <ItemDescription className="truncate">
                      {element.email}
                    </ItemDescription>
                    {/* Their own line, so a long email never hides them. */}
                    <span className="mt-1.5 flex flex-wrap gap-1 empty:hidden">
                      {groupsOf(element.userId).map((group) => (
                        <Badge
                          key={group.id}
                          variant="outline"
                          className="font-normal text-muted-foreground"
                        >
                          {group.name}
                        </Badge>
                      ))}
                    </span>
                  </ItemContent>
                  <ItemActions className="shrink-0">
                    <UserRoleBadge role={element.role.toString()} />
                    {people && (
                      <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </ItemActions>
                </Item>
              </div>
            ))}
          </ItemGroup>
        )}
      </ScrollArea>
      {people && (
        <div className="flex border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={async () => {
              await people.onInvite();
              setVersion((current) => current + 1);
            }}
          >
            <UserPlus aria-hidden="true" />
            {t("user.invite", "Invite")}
          </Button>
        </div>
      )}
    </>
  );
};

const UserListing = ({
  showListing,
  hideFunction,
  handleSelect,
  users,
  people
}: UserListingProps) => {
  const { t } = useTranslation();

  return (
    <ListPanel
      open={showListing}
      onClose={hideFunction}
      title={people ? t("user.people", "People") : t("user.selectUser")}
      bordered={!people}
    >
      {people ? (
        <Tabs defaultValue="members" className="min-h-0 flex-1 gap-0">
          <TabsList className="mx-4 mb-1 w-auto sm:w-fit">
            <TabsTrigger value="members">
              {t("user.members", "Members")}
            </TabsTrigger>
            <TabsTrigger value="groups">
              {t("groups.title", "Groups")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="flex min-h-0 flex-col">
            <UserList
              handleSelect={handleSelect}
              users={users}
              people={people}
            />
          </TabsContent>
          <TabsContent value="groups" className="flex min-h-0 flex-col">
            <GroupList congregation={people.congregation} />
          </TabsContent>
        </Tabs>
      ) : (
        <UserList handleSelect={handleSelect} users={users} />
      )}
    </ListPanel>
  );
};

export default UserListing;
