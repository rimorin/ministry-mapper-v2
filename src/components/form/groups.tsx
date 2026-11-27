import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { chipClass } from "../common/filter-chips";
import type { CongregationGroup } from "../../utils/helpers/getcongregationmembers";

interface GroupsFieldProps {
  groups: CongregationGroup[];
  value: string[];
  onValueChange: (value: string[]) => void;
}

const GroupsField = ({ groups, value, onValueChange }: GroupsFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <Label>{t("groups.title", "Groups")}</Label>
      {groups.length > 0 ? (
        <ToggleGroup
          multiple
          value={value}
          onValueChange={onValueChange}
          size="sm"
          variant="outline"
          spacing={1.5}
          aria-label={t("groups.title", "Groups")}
          className="w-full flex-wrap"
        >
          {groups.map((group) => (
            <ToggleGroupItem
              key={group.id}
              value={group.id}
              className={cn(chipClass, "px-3")}
            >
              {group.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("groups.noneYet", "No groups yet. Make them on the Groups tab.")}
        </p>
      )}
    </div>
  );
};

export default GroupsField;
