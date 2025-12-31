import { Container, Navbar, Spinner, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import NavBarBranding from "../../../components/navigation/branding";
import GenericButton from "../../../components/navigation/button";
import AggregationBadge from "../../../components/navigation/aggrbadge";
import ComponentAuthorizer from "../../../components/navigation/authorizer";
import ThemeToggle from "../../../components/navigation/themetoggle";
import { getAssetUrl } from "../../../utils/helpers/assetpath";
import { USER_ACCESS_LEVELS } from "../../../utils/constants";
import { territoryDetails } from "../../../utils/interface";
import { Policy } from "../../../utils/policies";
import TerritoryDropdown from "./territorydropdown";
import CongregationDropdown from "./congregationdropdown";
import AccountDropdown from "./accountdropdown";

interface AdminNavbarProps {
  congregationName: string;
  userCongregationAccesses: Array<{
    code: string;
    access: string;
    name: string;
  }>;
  congregationTerritoryList: Array<{ code: string; name: string }>;
  selectedTerritory: {
    id: string;
    code: string | undefined;
    name: string | undefined;
  };
  territories: Map<string, territoryDetails>;
  policy: Policy;
  userAccessLevel: string | undefined;
  isProcessingTerritory: boolean;
  isShowingUserListing: boolean;
  onToggleCongregationListing: () => void;
  onToggleTerritoryListing: () => void;
  onToggleLanguageSelector: () => void;
  onCreateTerritory: () => void;
  onTerritoryActions: {
    onCreateNew: () => void;
    onChangeCode: () => Promise<void>;
    onChangeName: () => Promise<void>;
    onChangeSequence: () => void;
    onDelete: () => void;
    onReset: () => void;
  };
  onCreateMap: () => void;
  onCongregationActions: {
    onShowSettings: () => void;
    onShowOptions: () => void;
    onManageUsers: () => void;
    onInviteUser: () => void;
  };
  onAccountActions: {
    onShowProfile: () => void;
    onShowAssignments: () => void;
    onPasswordReset: () => void;
    onLogout: () => void;
  };
}

export default function AdminNavbar({
  congregationName,
  userCongregationAccesses,
  congregationTerritoryList,
  selectedTerritory,
  territories,
  policy,
  userAccessLevel,
  isProcessingTerritory,
  isShowingUserListing,
  onToggleCongregationListing,
  onToggleTerritoryListing,
  onToggleLanguageSelector,
  onCreateTerritory,
  onTerritoryActions,
  onCreateMap,
  onCongregationActions,
  onAccountActions
}: AdminNavbarProps) {
  const { t } = useTranslation();

  return (
    <Navbar expand="lg" className="admin-navbar" sticky="top">
      <Container fluid>
        {congregationName ? (
          <NavBarBranding naming={congregationName} />
        ) : (
          <Spinner animation="border" as="span" size="sm" variant="primary" />
        )}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse
          id="basic-navbar-nav"
          className="justify-content-end mt-1"
        >
          {userCongregationAccesses.length > 1 && (
            <GenericButton
              className="m-1"
              size="sm"
              variant="outline-primary"
              onClick={onToggleCongregationListing}
              label={t(
                "congregation.selectCongregation",
                "Select Congregation"
              )}
            />
          )}
          {congregationTerritoryList &&
            congregationTerritoryList.length > 0 && (
              <GenericButton
                className="m-1"
                size="sm"
                variant="outline-primary"
                onClick={onToggleTerritoryListing}
                label={
                  selectedTerritory.code ? (
                    <>
                      <AggregationBadge
                        aggregate={
                          territories.get(selectedTerritory.id as string)
                            ?.aggregates || 0
                        }
                      />
                      {selectedTerritory.code}
                    </>
                  ) : (
                    t("territory.selectTerritory", "Select Territory")
                  )
                }
              />
            )}
          {!selectedTerritory.code && policy.hasOptions() && (
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={userAccessLevel}
            >
              <GenericButton
                className="m-1"
                size="sm"
                variant="outline-primary"
                onClick={onCreateTerritory}
                label={t("territory.createTerritory", "Create Territory")}
              />
            </ComponentAuthorizer>
          )}
          {selectedTerritory.code && policy.hasOptions() && (
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={userAccessLevel}
            >
              <TerritoryDropdown
                isProcessingTerritory={isProcessingTerritory}
                {...onTerritoryActions}
              />
            </ComponentAuthorizer>
          )}
          {selectedTerritory.code && policy.hasOptions() && (
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={userAccessLevel}
            >
              <GenericButton
                className="m-1"
                variant="outline-primary"
                size="sm"
                label={t("map.createMap", "Create Map")}
                onClick={onCreateMap}
              />
            </ComponentAuthorizer>
          )}
          <ComponentAuthorizer
            requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            userPermission={userAccessLevel}
          >
            <CongregationDropdown
              isShowingUserListing={isShowingUserListing}
              {...onCongregationActions}
            />
          </ComponentAuthorizer>
          <AccountDropdown
            userAccessLevel={userAccessLevel}
            {...onAccountActions}
          />
          <ThemeToggle className="m-1" />
          <GenericButton
            className="m-1"
            size="sm"
            variant="outline-primary"
            onClick={onToggleLanguageSelector}
            label={
              <Image
                src={getAssetUrl("language.svg")}
                alt="Language"
                width={16}
                height={16}
                className="language-icon"
              />
            }
          />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
