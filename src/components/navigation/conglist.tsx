import ListPanel from "@/components/common/list-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CongregationListingProps } from "../../utils/interface";
import UserRoleBadge from "./rolebadge";
import { useTranslation } from "react-i18next";

const CongListing = ({
  showListing,
  hideFunction,
  currentCongCode,
  handleSelect,
  congregations
}: CongregationListingProps) => {
  const { t } = useTranslation();
  const currentCongregations = congregations
    ? congregations.filter((element) => element.code !== currentCongCode)
    : [];

  return (
    <ListPanel
      open={showListing}
      onClose={hideFunction}
      title={t("congregation.selectCongregation")}
    >
      <ScrollArea className="min-h-0 flex-1" withFade>
        <div className="divide-y">
          {currentCongregations.map((element) => (
            <button
              type="button"
              key={`list-group-item-${element.code}`}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => handleSelect?.(element.code, e)}
            >
              <span className="min-w-0 truncate font-semibold">
                {element.name}
              </span>
              <span className="shrink-0">
                <UserRoleBadge role={element.access} />
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </ListPanel>
  );
};

export default CongListing;
