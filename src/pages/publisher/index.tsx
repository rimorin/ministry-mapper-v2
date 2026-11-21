import { lazy, use, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, LogOut, Palette, UserRound } from "lucide-react";
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
import LanguageSelector from "../../i18n/LanguageSelector";
import type useMyLinks from "../../hooks/useMyLinks";
import { useModalManagement } from "../../hooks/useModalManagement";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import { getUser } from "../../utils/pocketbase";

const GetProfile = lazy(() => import("../../components/modal/profile"));
const ThemeSettingsModal = lazy(
  () => import("../../components/modal/themesettings")
);

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
// links given to it, and nothing of the congregation behind them. Staff see
// the same panel inside their own shell.
const PublisherDashboard = ({
  userName,
  onLogout,
  myLinks
}: PublisherDashboardProps) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);
  const { showModal } = useModalManagement();
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
                <DropdownMenuLabel className="truncate">
                  {userName}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => showModal(GetProfile, { user: getUser() })}
              >
                <UserRound />
                {t("user.profile", "Profile")}
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
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOut />
                {t("auth.logout", "Logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <h1 className="min-w-0 flex-1 truncate px-1 text-base font-semibold">
            {t("myLinks.title", "My Maps")}
          </h1>
        </header>
        <MyLinksPanel myLinks={myLinks} />
      </div>
    </>
  );
};

export default PublisherDashboard;
