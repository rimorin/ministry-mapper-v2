import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { springCalm } from "@/lib/motion";
import type useMyLinks from "../../hooks/useMyLinks";
import InstallCard from "./install-card";
import MyLinks from "./my-links";

// The page body for the links given to the signed-in account, under whichever
// navbar the caller renders: the staff shell's or the publisher's own.
interface MyLinksPanelProps {
  // Fetched by the caller, which also shows the count elsewhere.
  myLinks: ReturnType<typeof useMyLinks>;
}

const MyLinksPanel = ({ myLinks }: MyLinksPanelProps) => {
  const { links, isLoading, hasFailed, isStale, updatedAt, refresh } = myLinks;

  const isEmpty = !isLoading && !hasFailed && links.length === 0;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      {/* Relative so a state on its way out stays where it was drawn. */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-2xl space-y-3 p-3 sm:p-4",
          // An empty page centres its message, as the shell's welcome does.
          isEmpty && "flex min-h-full flex-col justify-center pb-[20%]"
        )}
      >
        <MyLinks
          links={links}
          isLoading={isLoading}
          hasFailed={hasFailed}
          isStale={isStale}
          updatedAt={updatedAt}
          onRefresh={refresh}
        />
        {/* Glides to its new place when the page goes from centred to a list. */}
        {!isLoading && (
          <m.div layout="position" transition={{ layout: springCalm }}>
            <InstallCard />
          </m.div>
        )}
      </div>
    </main>
  );
};

export default MyLinksPanel;
