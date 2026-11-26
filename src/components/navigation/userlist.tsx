import { useState } from "react";
import { Search, SearchX, UserPlus, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
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
import UserRoleBadge from "./rolebadge";
import GroupList from "./grouplist";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  onInvite
}: Pick<UserListingProps, "handleSelect" | "users"> & {
  // People's Members tab ends with it, as Groups ends with "New group".
  onInvite?: () => void;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState(ALL_ROLES);

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
              <Item
                key={`list-group-item-${element.roleId}`}
                className="flex-nowrap rounded-none border-0 border-b border-border text-left last:border-b-0 hover:bg-accent hover:text-accent-foreground"
                render={
                  <button
                    type="button"
                    onClick={(e) => handleSelect?.(element.roleId, e)}
                  />
                }
              >
                <ItemContent className="min-w-0 gap-0">
                  <ItemTitle className="block w-full truncate text-base font-semibold">
                    {element.name}
                  </ItemTitle>
                  <ItemDescription className="line-clamp-1">
                    {element.email}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="shrink-0">
                  <UserRoleBadge role={element.role.toString()} />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </ScrollArea>
      {onInvite && (
        <div className="flex border-t px-4 py-3 sm:justify-end">
          <Button type="button" className="w-full sm:w-auto" onClick={onInvite}>
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
    <Sheet open={showListing} onOpenChange={(open) => !open && hideFunction()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[100dvh] gap-0 overflow-hidden p-0 sm:h-[85dvh] sm:rounded-t-2xl"
      >
        <SheetHeader className={cn("px-4 py-3", !people && "border-b")}>
          <div className="flex items-center gap-3">
            <SheetTitle className="fluid-text mr-auto font-bold text-left">
              {people ? t("user.people", "People") : t("user.selectUser")}
            </SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                />
              }
            >
              <X className="size-4" />
            </SheetClose>
          </div>
        </SheetHeader>
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
                onInvite={people.onInvite}
              />
            </TabsContent>
            <TabsContent value="groups" className="flex min-h-0 flex-col">
              <GroupList congregation={people.congregation} />
            </TabsContent>
          </Tabs>
        ) : (
          <UserList handleSelect={handleSelect} users={users} />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default UserListing;
