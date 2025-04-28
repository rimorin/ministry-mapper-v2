import { memo } from "react";
import { Badge } from "react-bootstrap";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { UserRoleBadgeProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const UserRoleBadge = memo(({ role }: UserRoleBadgeProps) => {
  const { t } = useTranslation();

  if (!role) return <Badge bg="secondary">?</Badge>;

  switch (role) {
    case USER_ACCESS_LEVELS.READ_ONLY.CODE:
      return <Badge bg="secondary">{t("user.roles.readOnly")}</Badge>;
    case USER_ACCESS_LEVELS.CONDUCTOR.CODE:
      return <Badge bg="success">{t("user.roles.conductor")}</Badge>;
    case USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE:
      return <Badge bg="primary">{t("user.roles.administrator")}</Badge>;
    default:
      return <Badge bg="secondary">?</Badge>;
  }
});

export default UserRoleBadge;
