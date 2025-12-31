import { useTranslation } from "react-i18next";
import ComponentAuthorizer from "../../../components/navigation/authorizer";
import {
  GenericDropdownButton,
  GenericDropdownItem
} from "../../../components/navigation/dropdownbutton";
import { USER_ACCESS_LEVELS } from "../../../utils/constants";

interface AccountDropdownProps {
  userAccessLevel: string | undefined;
  onShowProfile: () => void;
  onShowAssignments: () => void;
  onPasswordReset: () => void;
  onLogout: () => void;
}

export default function AccountDropdown({
  userAccessLevel,
  onShowProfile,
  onShowAssignments,
  onPasswordReset,
  onLogout
}: AccountDropdownProps) {
  const { t } = useTranslation();

  return (
    <GenericDropdownButton
      className="dropdown-btn"
      size="sm"
      variant="outline-primary"
      label={t("user.account", "Account")}
      align={{ lg: "end" }}
    >
      <GenericDropdownItem onClick={onShowProfile}>
        {t("user.profile", "Profile")}
      </GenericDropdownItem>
      <ComponentAuthorizer
        requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
        userPermission={userAccessLevel}
      >
        <GenericDropdownItem onClick={onShowAssignments}>
          {t("assignments.assignments", "Assignments")}
        </GenericDropdownItem>
      </ComponentAuthorizer>
      <GenericDropdownItem onClick={onPasswordReset}>
        {t("auth.changePassword", "Change Password")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onLogout}>
        {t("auth.logout", "Logout")}
      </GenericDropdownItem>
    </GenericDropdownButton>
  );
}
