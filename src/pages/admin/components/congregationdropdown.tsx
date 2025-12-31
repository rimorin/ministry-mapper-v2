import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  GenericDropdownButton,
  GenericDropdownItem
} from "../../../components/navigation/dropdownbutton";

interface CongregationDropdownProps {
  isShowingUserListing: boolean;
  onShowSettings: () => void;
  onShowOptions: () => void;
  onManageUsers: () => void;
  onInviteUser: () => void;
}

export default function CongregationDropdown({
  isShowingUserListing,
  onShowSettings,
  onShowOptions,
  onManageUsers,
  onInviteUser
}: CongregationDropdownProps) {
  const { t } = useTranslation();

  return (
    <GenericDropdownButton
      className="dropdown-btn"
      size="sm"
      variant="outline-primary"
      label={
        <>
          {isShowingUserListing && (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                aria-hidden="true"
              />{" "}
            </>
          )}{" "}
          {t("congregation.congregation", "Congregation")}
        </>
      }
      align={{ lg: "end" }}
    >
      <GenericDropdownItem onClick={onShowSettings}>
        {t("congregation.settings", "Settings")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onShowOptions}>
        {t("congregation.householdOptions", "Household Options")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onManageUsers}>
        {t("user.manageUsers", "Manage Users")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onInviteUser}>
        {t("user.inviteUser", "Invite User")}
      </GenericDropdownItem>
    </GenericDropdownButton>
  );
}
