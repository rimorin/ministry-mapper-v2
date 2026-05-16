import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { UserRoleBadgeProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
  const { t } = useTranslation();

  if (!role) return <Badge variant="secondary">?</Badge>;

  switch (role) {
    case USER_ACCESS_LEVELS.READ_ONLY.CODE:
      return <Badge variant="secondary">{t("user.roles.readOnly")}</Badge>;
    case USER_ACCESS_LEVELS.CONDUCTOR.CODE:
      return (
        <Badge className={cn("bg-green-600 text-white hover:bg-green-700")}>
          {t("user.roles.conductor")}
        </Badge>
      );
    case USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE:
      return <Badge>{t("user.roles.administrator")}</Badge>;
    default:
      return <Badge variant="secondary">?</Badge>;
  }
};

export default UserRoleBadge;
