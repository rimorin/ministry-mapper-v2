import * as React from "react";
import * as m from "motion/react-m";
import { stagger, useAnimate, useReducedMotion } from "motion/react";
import {
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  ClipboardList,
  FilePlus,
  Home,
  KeyRound,
  LogOut,
  Map,
  MapPin,
  Pentagon,
  Plus,
  RotateCcw,
  Settings,
  SquarePen,
  Trash2,
  User,
  UserPlus,
  Users
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import NavBarBranding from "../../../components/navigation/branding";
import AggregationBadge from "../../../components/navigation/aggrbadge";
import ComponentAuthorizer from "../../../components/navigation/authorizer";
import ThemeToggle from "../../../components/navigation/themetoggle";
import ReleaseHistoryBtn from "../../../components/navigation/releasehistorybtn";
import LanguageBtn from "../../../components/navigation/languagebtn";
import PendingBadge from "../../../components/navigation/pendingbadge";
import { USER_ACCESS_LEVELS } from "../../../utils/constants";
import { territoryDetails } from "../../../utils/interface";
import { Policy } from "../../../utils/policies";

const sectionIn = (delay: number) => ({
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay }
});

function runSectionStagger(
  open: boolean,
  scope: ReturnType<typeof useAnimate>[0],
  animate: ReturnType<typeof useAnimate>[1],
  shouldReduceMotion: boolean | null,
  axis: "x" | "y"
) {
  if (!open || !scope.current || shouldReduceMotion) return;
  const from = axis === "x" ? { x: [-4, 0] } : { y: [8, 0] };
  void animate(
    "li",
    { opacity: [0, 1], ...from },
    { delay: stagger(0.04), duration: 0.2, ease: "easeOut" }
  );
}

// Open/close + persisted state + entrance stagger for a sidebar Collapsible section.
// persistKey stores/reads its own open state in localStorage; omit it for
// sections (like Account) that shouldn't remember their state across reloads.
function useCollapsibleSection(
  axis: "x" | "y",
  shouldReduceMotion: boolean | null,
  options: { persistKey?: string; defaultOpen?: boolean } = {}
) {
  const { persistKey, defaultOpen = false } = options;
  const [open, setOpenState] = React.useState(() => {
    if (!persistKey) return defaultOpen;
    try {
      const stored = localStorage.getItem(persistKey);
      return stored === null ? defaultOpen : stored === "true";
    } catch {
      return defaultOpen;
    }
  });
  const [scope, animate] = useAnimate();

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, String(next));
      } catch {}
    }
  };

  React.useEffect(() => {
    runSectionStagger(open, scope, animate, shouldReduceMotion, axis);
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- only re-run when section opens
  }, [open]);

  return { open, setOpen, scope };
}

interface AppSidebarProps {
  congregationName: string;
  userName?: string;
  userEmail?: string;
  userCongregationAccesses: Array<{
    code: string;
    access: string;
    name: string;
  }>;
  congregationTerritoryList: Array<{ code: string; name: string }>;
  selectedTerritory: {
    id: string;
    code: string | undefined;
    name: string | undefined;
  };
  territories: Map<string, territoryDetails>;
  policy: Policy;
  userAccessLevel: string | undefined;
  isProcessingTerritory: boolean;
  isShowingUserListing: boolean;
  onToggleCongregationListing: () => void;
  onToggleTerritoryListing: () => void;
  onToggleLanguageSelector: () => void;
  onCreateTerritory: () => void;
  onTerritoryActions: {
    onCreateNew: () => void;
    onChangeDetails: () => Promise<void>;
    onChangeLocation: () => void;
    onChangeSequence: () => void;
    onDelete: () => void;
    onReset: () => void;
  };
  onCongregationActions: {
    onShowSettings: () => void;
    onShowOptions: () => void;
    onManageUsers: () => void;
    onInviteUser: () => void;
    onGenerateReport: () => void;
  };
  onAccountActions: {
    onShowProfile: () => void;
    onShowAssignments: () => void;
    onPasswordReset: () => void;
    onLogout: () => void;
  };
  pendingCount?: number;
}

export function AppSidebar({
  congregationName,
  userName,
  userEmail,
  userCongregationAccesses,
  congregationTerritoryList,
  selectedTerritory,
  territories,
  policy,
  userAccessLevel,
  isProcessingTerritory,
  isShowingUserListing,
  pendingCount = 0,
  onToggleCongregationListing,
  onToggleTerritoryListing,
  onToggleLanguageSelector,
  onCreateTerritory,
  onTerritoryActions,
  onCongregationActions,
  onAccountActions
}: AppSidebarProps) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const manage = useCollapsibleSection("x", shouldReduceMotion, {
    persistKey: "sidebar-manage-open",
    defaultOpen: true
  });
  const congregationSection = useCollapsibleSection("x", shouldReduceMotion, {
    persistKey: "sidebar-congregation-open"
  });
  const account = useCollapsibleSection("y", shouldReduceMotion);

  const userInitials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const closeSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleAction = (action: () => void | Promise<void>) => () => {
    closeSidebar();
    void action();
  };

  return (
    <Sidebar>
      <m.div {...sectionIn(0.1)}>
        <SidebarHeader className="gap-2 border-b border-sidebar-border px-4 py-3">
          {congregationName ? (
            userCongregationAccesses.length > 1 ? (
              <button
                type="button"
                className="flex w-full min-w-0 cursor-pointer items-center gap-1 rounded-md px-1 transition-colors hover:bg-sidebar-accent"
                onClick={onToggleCongregationListing}
              >
                <NavBarBranding naming={congregationName} />
                <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
              </button>
            ) : (
              <NavBarBranding naming={congregationName} />
            )
          ) : (
            <Spinner aria-hidden="true" className="text-primary" />
          )}
          {pendingCount > 0 && (
            <PendingBadge count={pendingCount} className="w-fit" />
          )}
        </SidebarHeader>
      </m.div>

      <SidebarContent>
        <m.div {...sectionIn(0.17)}>
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("common.workspace", "Workspace")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {congregationTerritoryList.length > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={!!selectedTerritory.code}
                      onClick={handleAction(onToggleTerritoryListing)}
                      className="gap-2"
                    >
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      {selectedTerritory.code ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <AggregationBadge
                            aggregate={
                              territories.get(selectedTerritory.id as string)
                                ?.aggregates || 0
                            }
                            size="sm"
                          />
                          <span className="font-medium">
                            {selectedTerritory.code}
                          </span>
                        </div>
                      ) : (
                        t("territory.selectTerritory", "Select Territory")
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {!selectedTerritory.code && policy.hasOptions() && (
                  <ComponentAuthorizer
                    requiredPermission={
                      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                    }
                    userPermission={userAccessLevel}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={handleAction(onCreateTerritory)}
                        className="gap-2"
                      >
                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                        {t("territory.createTerritory", "Create Territory")}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </ComponentAuthorizer>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </m.div>

        {selectedTerritory.code && policy.hasOptions() && (
          <ComponentAuthorizer
            requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            userPermission={userAccessLevel}
          >
            <m.div {...sectionIn(0.24)}>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Collapsible
                        className="group/collapsible"
                        open={manage.open}
                        onOpenChange={manage.setOpen}
                      >
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton className="justify-between gap-2" />
                          }
                        >
                          <span className="flex items-center gap-2">
                            <Map className="size-4 shrink-0 text-muted-foreground" />
                            {isProcessingTerritory && (
                              <Spinner
                                data-icon="inline-start"
                                aria-hidden="true"
                              />
                            )}
                            {t("territory.territory", "Manage")}
                          </span>
                          <ChevronDown className="size-4 shrink-0 transition-transform group-data-open/collapsible:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div ref={manage.scope}>
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  render={
                                    <button
                                      type="button"
                                      onClick={handleAction(
                                        onTerritoryActions.onCreateNew
                                      )}
                                    />
                                  }
                                >
                                  <FilePlus className="size-3.5 shrink-0 text-muted-foreground" />
                                  {t("territory.createNew", "New Territory")}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  render={
                                    <button
                                      type="button"
                                      onClick={handleAction(
                                        onTerritoryActions.onChangeDetails
                                      )}
                                    />
                                  }
                                >
                                  <SquarePen className="size-3.5 shrink-0 text-muted-foreground" />
                                  {t(
                                    "territory.changeDetails",
                                    "Change Details"
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  render={
                                    <button
                                      type="button"
                                      onClick={handleAction(
                                        onTerritoryActions.onChangeLocation
                                      )}
                                    />
                                  }
                                >
                                  <Pentagon className="size-3.5 shrink-0 text-muted-foreground" />
                                  {t(
                                    "territory.changeBoundary",
                                    "Change Boundary"
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  render={
                                    <button
                                      type="button"
                                      onClick={handleAction(
                                        onTerritoryActions.onChangeSequence
                                      )}
                                    />
                                  }
                                >
                                  <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                                  {t(
                                    "territory.changeSequence",
                                    "Reorder Maps"
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <Separator className="my-1" />
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  render={
                                    <button
                                      type="button"
                                      onClick={handleAction(
                                        onTerritoryActions.onReset
                                      )}
                                    />
                                  }
                                >
                                  <RotateCcw className="size-3.5 shrink-0 text-muted-foreground" />
                                  {t("territory.resetStatus", "Reset Status")}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  className="text-destructive hover:text-destructive"
                                  render={
                                    <button
                                      type="button"
                                      onClick={handleAction(
                                        onTerritoryActions.onDelete
                                      )}
                                    />
                                  }
                                >
                                  <Trash2 className="size-3.5 shrink-0" />
                                  {t(
                                    "territory.deleteCurrent",
                                    "Delete Territory"
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </m.div>
          </ComponentAuthorizer>
        )}

        <ComponentAuthorizer
          requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
          userPermission={userAccessLevel}
        >
          <m.div {...sectionIn(0.31)}>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible
                      className="group/collapsible"
                      open={congregationSection.open}
                      onOpenChange={congregationSection.setOpen}
                    >
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton className="justify-between gap-2" />
                        }
                      >
                        <span className="flex items-center gap-2">
                          <Users className="size-4 shrink-0 text-muted-foreground" />
                          {isShowingUserListing && (
                            <Spinner
                              data-icon="inline-start"
                              aria-hidden="true"
                            />
                          )}
                          {t("congregation.congregation", "Congregation")}
                        </span>
                        <ChevronDown className="size-4 shrink-0 transition-transform group-data-open/collapsible:rotate-180" />
                      </CollapsibleTrigger>
                      {pendingCount > 0 && (
                        <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>
                      )}
                      <CollapsibleContent>
                        <div ref={congregationSection.scope}>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type="button"
                                    onClick={handleAction(
                                      onCongregationActions.onShowSettings
                                    )}
                                  />
                                }
                              >
                                <Settings className="size-3.5 shrink-0 text-muted-foreground" />
                                {t("congregation.settings", "Settings")}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type="button"
                                    onClick={handleAction(
                                      onCongregationActions.onShowOptions
                                    )}
                                  />
                                }
                              >
                                <Home className="size-3.5 shrink-0 text-muted-foreground" />
                                {t(
                                  "congregation.householdOptions",
                                  "Household Options"
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type="button"
                                    onClick={handleAction(
                                      onCongregationActions.onManageUsers
                                    )}
                                  />
                                }
                              >
                                <Users className="size-3.5 shrink-0 text-muted-foreground" />
                                {t("user.manageUsers", "Manage Users")}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type="button"
                                    onClick={handleAction(
                                      onCongregationActions.onInviteUser
                                    )}
                                  />
                                }
                              >
                                <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
                                {t("user.inviteUser", "Invite User")}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type="button"
                                    onClick={handleAction(
                                      onCongregationActions.onGenerateReport
                                    )}
                                  />
                                }
                              >
                                <BarChart3 className="size-3.5 shrink-0 text-muted-foreground" />
                                {t(
                                  "congregation.generateReport",
                                  "Generate Report"
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </m.div>
        </ComponentAuthorizer>

        <div className="flex-1" />

        <m.div {...sectionIn(0.38)}>
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("user.account", "Account")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Collapsible
                    className="group/collapsible"
                    open={account.open}
                    onOpenChange={account.setOpen}
                  >
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton className="justify-between gap-2 h-auto py-2" />
                      }
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex flex-col items-start min-w-0">
                          <span className="text-sm font-medium leading-tight truncate max-w-35">
                            {userName || t("user.account", "Account")}
                          </span>
                          {userEmail && (
                            <span className="text-xs text-muted-foreground truncate max-w-35">
                              {userEmail}
                            </span>
                          )}
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 transition-transform group-data-open/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div ref={account.scope}>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              render={
                                <button
                                  type="button"
                                  onClick={handleAction(
                                    onAccountActions.onShowProfile
                                  )}
                                />
                              }
                            >
                              <User className="size-3.5 shrink-0 text-muted-foreground" />
                              {t("user.profile", "Profile")}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <ComponentAuthorizer
                            requiredPermission={
                              USER_ACCESS_LEVELS.CONDUCTOR.CODE
                            }
                            userPermission={userAccessLevel}
                          >
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                render={
                                  <button
                                    type="button"
                                    onClick={handleAction(
                                      onAccountActions.onShowAssignments
                                    )}
                                  />
                                }
                              >
                                <ClipboardList className="size-3.5 shrink-0 text-muted-foreground" />
                                {t("assignments.assignments", "Assignments")}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </ComponentAuthorizer>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              render={
                                <button
                                  type="button"
                                  onClick={handleAction(
                                    onAccountActions.onPasswordReset
                                  )}
                                />
                              }
                            >
                              <KeyRound className="size-3.5 shrink-0 text-muted-foreground" />
                              {t("auth.changePassword", "Change Password")}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className="text-destructive hover:text-destructive"
                              render={
                                <button
                                  type="button"
                                  onClick={handleAction(
                                    onAccountActions.onLogout
                                  )}
                                />
                              }
                            >
                              <LogOut className="size-3.5 shrink-0" />
                              {t("auth.logout", "Logout")}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </m.div>
      </SidebarContent>

      <m.div {...sectionIn(0.45)}>
        <SidebarFooter className="p-0">
          <SidebarSeparator />
          <TooltipProvider>
            <div className="flex gap-2 p-3">
              <Tooltip>
                <TooltipTrigger render={<span className="flex-1" />}>
                  <div className="flex flex-col items-center gap-0.5">
                    <ReleaseHistoryBtn className="w-full" />
                    <span className="text-[10px] text-muted-foreground">
                      {t("releaseNotes.historyShort", "Updates")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("releaseNotes.history", "Release History")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={<span className="flex-1" />}>
                  <div className="flex flex-col items-center gap-0.5">
                    <ThemeToggle className="w-full" />
                    <span className="text-[10px] text-muted-foreground">
                      {t("theme.settingsShort", "Theme")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("theme.settings", "Theme")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={<span className="flex-1" onClick={closeSidebar} />}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <LanguageBtn
                      onClick={onToggleLanguageSelector}
                      className="w-full"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {t("common.Language", "Language")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("common.Language", "Language")}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </SidebarFooter>
      </m.div>
      <SidebarRail />
    </Sidebar>
  );
}
