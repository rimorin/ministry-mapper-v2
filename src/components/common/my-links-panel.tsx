import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type useMyLinks from "../../hooks/useMyLinks";
import MyLinks from "./my-links";

// The page body for the links given to the signed-in account, under whichever
// navbar the caller renders: the staff shell's or the publisher's own.
interface MyLinksPanelProps {
  // Fetched by the caller, which also shows the count elsewhere.
  myLinks: ReturnType<typeof useMyLinks>;
}

const MyLinksPanel = ({ myLinks }: MyLinksPanelProps) => {
  const { t } = useTranslation();
  const { links, isLoading, hasFailed, refresh } = myLinks;

  // The empty and failed states explain themselves, so the hint only goes
  // with a list.
  const hasLinks = !isLoading && !hasFailed && links.length > 0;
  const isEmpty = !isLoading && !hasFailed && links.length === 0;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto w-full max-w-2xl space-y-3 p-3 sm:p-4",
          // An empty page centres its message, as the shell's welcome does.
          isEmpty && "flex min-h-full flex-col justify-center pb-[20%]"
        )}
      >
        {hasLinks && (
          <p className="text-sm text-muted-foreground">
            {t("myLinks.description", "Tap a map to start working.")}
          </p>
        )}
        <MyLinks
          links={links}
          isLoading={isLoading}
          hasFailed={hasFailed}
          onRefresh={refresh}
        />
      </div>
    </main>
  );
};

export default MyLinksPanel;
