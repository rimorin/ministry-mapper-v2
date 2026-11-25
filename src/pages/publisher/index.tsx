import { lazy, use, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  CircleHelp,
  Languages,
  LogOut,
  Palette,
  UserRound
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import MyLinksPanel from "@/components/common/my-links-panel";
import { LanguageContext } from "../../i18n/LanguageContext";
import { ThemeContext } from "../../components/utils/context";
import { USER_GUIDE_URL } from "../../utils/constants";
import LanguageSelector from "../../i18n/LanguageSelector";
import type useMyLinks from "../../hooks/useMyLinks";
import { useModalManagement } from "../../hooks/useModalManagement";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import { getUser } from "../../utils/pocketbase";

const GetProfile = lazy(() => import("../../components/modal/profile"));
const ThemeSettingsModal = lazy(
  () => import("../../components/modal/themesettings")
);

const THEME_LABELS = {
  light: "theme.light",
  dark: "theme.dark",
  system: "theme.system"
} as const;

interface PublisherDashboardProps {
  userName: string;
  onLogout: () => void;
  myLinks: ReturnType<typeof useMyLinks>;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// What an account with only the publisher role sees after signing in: the
// links given to it, and of the congregation behind them only its name. Staff see
// the same panel inside their own shell.
const PublisherDashboard = ({
  userName,
  onLogout,
  myLinks
}: PublisherDashboardProps) => {
  const { t } = useTranslation();
  const { congregations } = myLinks;
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);
  const { showModal } = useModalManagement();
  const { theme } = use(ThemeContext);
  const userEmail = getUser("email") as string | null;
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    document.title = "Ministry Mapper";
  }, []);

  const toggleLanguageSelector = () =>
    setShowLanguageSelector((showing) => !showing);

  const handleLanguageSelect = (language: string) => {
    changeLanguage(language);
    trackEvent(ANALYTICS_EVENTS.LANGUAGE_CHANGED, { language });
    toggleLanguageSelector();
  };

  const currentLanguageLabel = languageOptions.find((option) =>
    currentLanguage.startsWith(option.value)
  )?.label;

  return (
    <>
      <LanguageSelector
        showListing={showLanguageSelector}
        hideFunction={toggleLanguageSelector}
        handleSelect={handleLanguageSelect}
        currentLanguage={currentLanguage}
        languageOptions={languageOptions}
      />
      <div className="flex h-dvh flex-col">
        {/* Same bar as the staff shell's navbar, with the account menu where the
            sidebar trigger sits: the top-right corner belongs to the environment
            badge outside production. */}
        <header className="sticky top-0 z-50 flex items-center gap-2 border-b bg-background px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="shrink-0 rounded-full"
                  aria-label={t("myLinks.accountMenu", "Account menu")}
                />
              }
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  {initialsOf(userName)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuGroup>
                {/* The email tells apart a Google, Apple or email sign-in. */}
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate text-foreground">{userName}</span>
                  {userEmail && (
                    <span className="truncate text-xs font-normal">
                      {userEmail}
                    </span>
                  )}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => showModal(GetProfile, { user: getUser() })}
              >
                <UserRound />
                {t("user.profileAndNotifications", "Profile & notifications")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleLanguageSelector}>
                <Languages />
                {t("common.language", "Language")}
                <span className="ml-auto text-xs text-muted-foreground">
                  {currentLanguageLabel}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => showModal(ThemeSettingsModal, {})}
              >
                <Palette />
                {t("theme.theme", "Theme")}
                <span className="ml-auto text-xs text-muted-foreground">
                  {t(THEME_LABELS[theme])}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(USER_GUIDE_URL, "_blank", "noopener")
                }
              >
                <CircleHelp />
                {t("common.help", "Help")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOut />
                {t("auth.logout", "Logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* The congregations sit under the title, where a workspace's name
              goes: there with maps and with none, and out of the list's way. */}
          <div className="min-w-0 flex-1 px-1">
            <h1 className="truncate text-base leading-tight font-semibold">
              {t("myLinks.title", "My Maps")}
            </h1>
            {congregations.length === 1 && (
              <p className="truncate text-xs text-muted-foreground">
                {congregations[0]}
              </p>
            )}
            {/* Several names do not fit a phone's header, and cut short they
                say less than a count does. The count opens the list. */}
            {congregations.length > 1 && (
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="-mx-1 flex max-w-full items-center gap-0.5 rounded-sm px-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  }
                >
                  <span className="truncate">
                    {t("myLinks.congregationCount", "{{total}} congregations", {
                      total: congregations.length
                    })}
                  </span>
                  <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 gap-2">
                  <PopoverTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t("myLinks.congregationsTitle", "Your congregations")}
                  </PopoverTitle>
                  <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm">
                    {congregations.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </header>
        <MyLinksPanel myLinks={myLinks} />
      </div>
    </>
  );
};

export default PublisherDashboard;
