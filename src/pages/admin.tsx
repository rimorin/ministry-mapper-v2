import "../css/admin.css";

import { useEffect, useCallback, useContext, lazy } from "react";
import { Container, Navbar, Spinner, Image } from "react-bootstrap";

import { AuthRecord } from "pocketbase";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../utils/helpers/assetpath";

import {
  valuesDetails,
  adminProps,
  addressDetails,
  territoryDetails,
  userDetails
} from "../utils/interface";
import { LinkSession, Policy } from "../utils/policies";
import {
  USER_ACCESS_LEVELS,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_SELF_DESTRUCT_HOURS,
  PB_FIELDS,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION
} from "../utils/constants";
import errorHandler from "../utils/helpers/errorhandler";

// Import custom hooks
import useTerritoryManagement from "../hooks/useTerritoryManagement";
import useMapManagement from "../hooks/useMapManagement";
import useCongregationManagement from "../hooks/useCongManagement";
import useUIState from "../hooks/useUIManagement";

// Import components
import TerritoryListing from "../components/navigation/territorylist";
import UserListing from "../components/navigation/userlist";
import NavBarBranding from "../components/navigation/branding";
import AggregationBadge from "../components/navigation/aggrbadge";
import ComponentAuthorizer from "../components/navigation/authorizer";
import TerritoryHeader from "../components/navigation/territoryheader";
import Loader from "../components/statics/loader";
import Welcome from "../components/statics/welcome";
import SuspenseComponent from "../components/utils/suspense";
import CongListing from "../components/navigation/conglist";
import useVisibilityChange from "../hooks/useVisibilityManagement";
import MapListing from "../components/navigation/maplist";
import MapView from "../components/navigation/mapview";
import SpeedDial from "../components/navigation/speeddial";
import LanguageSelector from "../i18n/LanguageSelector";
import {
  cleanupSession,
  callFunction,
  getList,
  getDataById,
  getUser,
  setupRealtimeListener,
  requestPasswordReset,
  unsubscriber
} from "../utils/pocketbase";
import { LanguageContext } from "../i18n/LanguageContext";
import { useModalManagement } from "../hooks/useModalManagement";
import GenericButton from "../components/navigation/button";
import {
  GenericDropdownButton,
  GenericDropdownItem
} from "../components/navigation/dropdownbutton";
import BackToTopButton from "../components/navigation/backtotop";
import ModeToggle from "../components/navigation/maptoggle";
import ThemeToggle from "../components/navigation/themetoggle";

const UnauthorizedPage = SuspenseComponent(
  lazy(() => import("../components/statics/unauth"))
);
const UpdateUser = lazy(() => import("../components/modal/updateuser"));
const UpdateCongregationSettings = lazy(
  () => import("../components/modal/congsettings")
);
const UpdateCongregationOptions = lazy(
  () => import("../components/modal/congoptions")
);
const NewTerritoryCode = lazy(
  () => import("../components/modal/newterritorycd")
);
const NewSingleMap = lazy(() => import("../components/modal/newpublicadd"));
const NewMultiMap = lazy(() => import("../components/modal/newprivateadd"));
const InviteUser = lazy(() => import("../components/modal/inviteuser"));
const GetProfile = lazy(() => import("../components/modal/profile"));
const GetAssignments = lazy(() => import("../components/modal/assignments"));
const ChangeTerritoryName = lazy(
  () => import("../components/modal/changeterritoryname")
);
const ChangeTerritoryCode = lazy(
  () => import("../components/modal/changeterritorycd")
);
const QuickLinkModal = lazy(() => import("../components/modal/getquicklink"));

function Admin({ user }: adminProps) {
  const { t } = useTranslation();
  const userId = user?.id as string;
  const userName = user?.name as string;
  const userEmail = user?.email as string;

  const {
    processingMap,
    sortedAddressList,
    setSortedAddressList,
    accordingKeys,
    setAccordionKeys,
    mapViews,
    setMapViews,
    isMapView,
    setIsMapView,
    deleteMap,
    addFloorToMap,
    resetMap,
    processMapRecord
  } = useMapManagement();

  const {
    congregationName,
    setCongregationName,
    congregationUsers,
    setCongregationUsers,
    showCongregationListing,
    showUserListing,
    isShowingUserListing,
    toggleCongregationListing,
    toggleUserListing,
    getUsers,
    userAccessLevel,
    setUserAccessLevel,
    defaultExpiryHours,
    setDefaultExpiryHours,
    policy,
    setPolicy,
    userCongregationAccesses,
    setUserCongregationAccesses,
    congregationCode,
    setCongregationCode,
    congregationCodeCache,
    setCongregationCodeCache,
    congregationAccess,
    handleCongregationSelect
  } = useCongregationManagement({ userId });

  const {
    selectedTerritory,
    setSelectedTerritory,
    territories,
    setTerritories,
    showTerritoryListing,
    toggleTerritoryListing,
    handleTerritorySelect,
    deleteTerritory,
    resetTerritory,
    processCongregationTerritories,
    congregationTerritoryList,
    isProcessingTerritory,
    territoryCodeCache,
    setTerritoryCodeCache,
    clearTerritorySelection
  } = useTerritoryManagement({ congregationCode });

  const {
    showBkTopButton,
    isLoading,
    setIsLoading,
    isUnauthorised,
    setIsUnauthorised,
    showChangeAddressTerritory,
    showLanguageSelector,
    values,
    setValues,
    isAssignmentLoading,
    setIsAssignmentLoading,
    handleScroll,
    toggleAddressTerritoryListing,
    toggleLanguageSelector
  } = useUIState();

  const { showModal } = useModalManagement();

  const { currentLanguage, changeLanguage, languageOptions } =
    useContext(LanguageContext);

  const logoutUser = useCallback(() => cleanupSession(), []);

  const handleUserSelect = useCallback(
    async (userKey: string | null) => {
      if (!userKey) return;
      const details = congregationUsers.get(userKey);
      if (!details) return;
      const updatedRole = await showModal(UpdateUser, {
        uid: userKey,
        congregation: congregationCode,
        footerSaveAcl: userAccessLevel,
        name: details.name,
        role: details.role
      });

      setCongregationUsers((existingUsers) => {
        if (updatedRole === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
          existingUsers.delete(userKey);
          return new Map<string, userDetails>(existingUsers);
        }
        details.role = updatedRole as string;
        return new Map<string, userDetails>(
          existingUsers.set(userKey, details)
        );
      });
    },
    [congregationUsers, congregationCode, userAccessLevel]
  );

  const handleLanguageSelect = useCallback((lang: string) => {
    changeLanguage(lang);
    toggleLanguageSelector();
  }, []);

  const getAssignments = useCallback(async (code: string, uid: string) => {
    setIsAssignmentLoading(true);
    try {
      const assignments = await getList("assignments", {
        filter: `user="${uid}"`,
        sort: "created",
        expand: "map",
        fields: PB_FIELDS.ASSIGNMENTS,
        requestKey: `get-usr-assignments-${uid}`
      });

      if (assignments.length === 0) {
        alert(t("assignments.noAssignmentsFound", "No assignments found."));
        return;
      }

      const linkListing = new Array<LinkSession>();
      assignments.forEach((link) => {
        linkListing.push(new LinkSession(link, link.id));
      });
      showModal(GetAssignments, {
        assignments: linkListing,
        congregation: code
      });
    } finally {
      setIsAssignmentLoading(false);
    }
  }, []);

  const handleGenerateTerritoryMap = useCallback(async () => {
    setIsAssignmentLoading(true);
    try {
      // Open modal to get publisher input first
      showModal(QuickLinkModal, {
        territoryId: selectedTerritory.id
      });
    } finally {
      setIsAssignmentLoading(false);
    }
  }, [selectedTerritory.id]);

  const handleAddressTerritorySelect = useCallback(
    async (newTerritoryId: string | null) => {
      const details = values as valuesDetails;
      const mapId = details.map as string;
      const newTerritoryCode = territories.get(newTerritoryId as string)?.code;

      try {
        toggleAddressTerritoryListing();
        await callFunction("/map/territory/update", {
          method: "POST",
          body: {
            map: mapId,
            new_territory: newTerritoryId,
            old_territory: selectedTerritory.id
          }
        });
        setSortedAddressList(
          sortedAddressList.filter((address) => address.id !== mapId)
        );
        alert(
          t(
            "territory.changeSuccess",
            "Changed territory of {{name}} from {{oldCode}} to {{newCode}}.",
            {
              name: details.name,
              oldCode: selectedTerritory.code,
              newCode: newTerritoryCode
            }
          )
        );
      } catch (error) {
        errorHandler(error);
      }
    },
    [values, selectedTerritory.id, selectedTerritory.code]
  );

  const fetchData = useCallback(async () => {
    const userRoles = await getList("roles", {
      filter: `user="${userId}"`,
      expand: "congregation",
      fields: PB_FIELDS.ROLES,
      requestKey: `user-roles-${userId}`
    });
    if (userRoles.length === 0) {
      setIsLoading(false);
      setIsUnauthorised(true);
      errorHandler(`Unauthorised access by ${userEmail}`, false);
      return;
    }

    const congregationAccesses = userRoles.map((record) => {
      return {
        code: record.expand?.congregation.id,
        access: record.role,
        name: record.expand?.congregation.name
      };
    });

    congregationAccess.current = congregationAccesses.reduce(
      (acc, { code, access }) => {
        acc[code] = access;
        return acc;
      },
      {} as Record<string, string>
    );
    setUserCongregationAccesses(congregationAccesses);
    const isCongregationCodeCacheValid = congregationAccesses.some(
      (access) => access.code === congregationCodeCache
    );

    const initialSelectedCode = isCongregationCodeCacheValid
      ? congregationCodeCache
      : congregationAccesses?.[0]?.code;

    if (!isCongregationCodeCacheValid) {
      setCongregationCodeCache("");
    }
    setCongregationCode(initialSelectedCode);
  }, [userId, userEmail]);

  const fetchCongregationData = useCallback(async (code: string) => {
    const congDetails = await getDataById("congregations", code, {
      requestKey: `congregation-${code}`
    });

    if (!congDetails) {
      alert(t("congregation.notFound", "Congregation not found."));
      return;
    }

    const congOptions = await getList("options", {
      filter: `congregation="${code}"`,
      requestKey: `congregation-options-${code}`,
      fields: PB_FIELDS.CONGREGATION_OPTIONS,
      sort: "sequence"
    });

    setCongregationName(congDetails.name);
    document.title = congDetails.name;
    setDefaultExpiryHours(
      congDetails.expiry_hours || DEFAULT_SELF_DESTRUCT_HOURS
    );
    setPolicy(
      new Policy(
        getUser("name") as string,
        congOptions?.map((option) => {
          return {
            id: option.id,
            code: option.code,
            description: option.description,
            isCountable: option.is_countable,
            isDefault: option.is_default,
            sequence: option.sequence
          };
        }),
        congDetails.max_tries || DEFAULT_CONGREGATION_MAX_TRIES,
        congDetails.origin || DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
        congregationAccess.current[code],
        congDetails.expiry_hours || DEFAULT_SELF_DESTRUCT_HOURS
      )
    );

    const territoryDetails = await getList("territories", {
      filter: `congregation="${code}"`,
      requestKey: `territories-${code}`,
      sort: "code",
      fields: PB_FIELDS.TERRITORIES
    });
    const territoryMap = processCongregationTerritories(territoryDetails);
    setTerritories(territoryMap);

    if (territoryCodeCache && territoryMap.has(territoryCodeCache)) {
      setSelectedTerritory((prev) => ({
        ...prev,
        id: territoryCodeCache
      }));
    } else {
      setTerritoryCodeCache("");
    }

    setIsLoading(false);
  }, []);

  const setupAddresses = useCallback(
    async (territoryId: string) => {
      if (!territoryId) return;
      const maps = await getList("maps", {
        filter: `territory="${territoryId}"`,
        requestKey: null,
        sort: "code",
        fields: PB_FIELDS.MAPS
      });
      const newMapViews = new Map<string, boolean>();
      const newAccordionKeys = [] as Array<string>;
      const sortedMaps = maps.map((map) => {
        const mapId = map.id;
        newMapViews.set(mapId, isMapView);
        newAccordionKeys.push(mapId);
        return processMapRecord(map);
      });
      setSortedAddressList(sortedMaps);
      setAccordionKeys(newAccordionKeys);
      setMapViews(newMapViews);
    },
    [isMapView]
  );

  const toggleCongregation = useCallback((selectedCode: string | null) => {
    handleCongregationSelect(selectedCode);
    clearTerritorySelection();
  }, []);

  const handleShowCongregationSettings = useCallback(() => {
    showModal(UpdateCongregationSettings, {
      currentName: congregationName,
      currentCongregation: congregationCode,
      currentMaxTries: policy?.maxTries || DEFAULT_CONGREGATION_MAX_TRIES,
      currentDefaultExpiryHrs: defaultExpiryHours
    });
  }, [
    congregationName,
    congregationCode,
    policy?.maxTries,
    defaultExpiryHours
  ]);

  const handleShowCongregationOptions = useCallback(() => {
    showModal(UpdateCongregationOptions, {
      currentCongregation: congregationCode
    });
  }, [congregationCode]);

  const handleManageUsers = useCallback(async () => {
    await getUsers();
  }, [congregationCode]);

  const handleInviteUser = useCallback(() => {
    showModal(InviteUser, {
      uid: userId,
      congregation: congregationCode,
      footerSaveAcl: userAccessLevel
    });
  }, [congregationCode, userAccessLevel]);

  const handleShowProfile = useCallback(() => {
    showModal(GetProfile, {
      user: getUser() as AuthRecord
    });
  }, []);

  const handleShowAssignments = useCallback(() => {
    getAssignments(congregationCode, getUser("id") as string);
  }, [congregationCode]);

  const handlePasswordReset = useCallback(async () => {
    await requestPasswordReset();
    alert(t("auth.passwordResetConfirmation", "Password reset email sent."));
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!congregationCode) return;
    setUserAccessLevel(congregationAccess.current[congregationCode]);

    fetchCongregationData(congregationCode);

    setupRealtimeListener(
      "territories",
      (data) => {
        const territoryData = data.record;
        setTerritories((prev) => {
          const updatedTerritories = new Map(prev);
          if (data.action === "delete") {
            updatedTerritories.delete(territoryData.id);
          } else {
            updatedTerritories.set(territoryData.id, {
              id: territoryData.id,
              code: territoryData.code,
              name: territoryData.description,
              aggregates: territoryData.progress
            });
          }
          return updatedTerritories;
        });
      },
      {
        filter: `congregation="${congregationCode}"`,
        requestKey: null,
        fields: PB_FIELDS.TERRITORIES
      }
    );
    return () => {
      unsubscriber([
        "territories",
        "maps",
        "addresses",
        "messages",
        "assignments"
      ]);
    };
  }, [congregationCode]);

  useEffect(() => {
    if (!selectedTerritory.id) return;
    setupAddresses(selectedTerritory.id);
    const selectedTerritoryData = territories.get(selectedTerritory.id);
    setSelectedTerritory((prev) => ({
      ...prev,
      code: selectedTerritoryData?.code,
      name: selectedTerritoryData?.name
    }));
    setupRealtimeListener(
      "maps",
      (data) => {
        const mapId = data.record.id;
        const dataAction = data.action;
        setSortedAddressList((prevList) => {
          let updatedList = [] as Array<addressDetails>;
          if (dataAction === "update") {
            updatedList = prevList.map((map) => {
              if (map.id === mapId) {
                return processMapRecord(data.record);
              }
              return map;
            });
          } else if (dataAction === "create") {
            updatedList = [...prevList, processMapRecord(data.record)];
          } else if (dataAction === "delete") {
            updatedList = prevList.filter((address) => address.id !== mapId);
          }
          updatedList.sort((a, b) => a.mapId.localeCompare(b.mapId));
          return updatedList;
        });
        if (dataAction === "create") {
          setAccordionKeys((prev) => [...prev, mapId]);
        }
      },
      {
        filter: `territory="${selectedTerritory.id}"`,
        requestKey: null,
        fields: PB_FIELDS.MAPS
      }
    );
    return () => {
      unsubscriber(["addresses", "maps", "assignments", "messages"]);
      setSortedAddressList([]);
    };
  }, [selectedTerritory.id]);

  useVisibilityChange(() => setupAddresses(selectedTerritory.id));

  if (isLoading) return <Loader />;
  if (isUnauthorised) {
    return <UnauthorizedPage handleClick={logoutUser} name={userName} />;
  }

  const isReadonly = userAccessLevel === USER_ACCESS_LEVELS.READ_ONLY.CODE;

  return (
    <>
      <TerritoryListing
        showListing={showTerritoryListing}
        territories={congregationTerritoryList}
        selectedTerritory={selectedTerritory.code}
        hideFunction={toggleTerritoryListing}
        handleSelect={handleTerritorySelect}
      />
      <TerritoryListing
        showListing={showChangeAddressTerritory}
        territories={congregationTerritoryList}
        selectedTerritory={selectedTerritory.code}
        hideFunction={toggleAddressTerritoryListing}
        handleSelect={handleAddressTerritorySelect}
        hideSelectedTerritory={true}
      />
      <UserListing
        showListing={showUserListing}
        users={Array.from(congregationUsers.values())}
        hideFunction={toggleUserListing}
        handleSelect={handleUserSelect}
      />
      <CongListing
        showListing={showCongregationListing}
        congregations={userCongregationAccesses}
        currentCongCode={congregationCode}
        hideFunction={toggleCongregationListing}
        handleSelect={toggleCongregation}
      />
      <LanguageSelector
        showListing={showLanguageSelector}
        hideFunction={toggleLanguageSelector}
        handleSelect={handleLanguageSelect}
        currentLanguage={currentLanguage}
        languageOptions={languageOptions}
      />
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
                onClick={toggleCongregationListing}
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
                  onClick={toggleTerritoryListing}
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
                  onClick={() =>
                    showModal(NewTerritoryCode, {
                      footerSaveAcl: userAccessLevel,
                      congregation: congregationCode
                    })
                  }
                  label={t("territory.createTerritory", "Create Territory")}
                />
              </ComponentAuthorizer>
            )}
            {selectedTerritory.code && policy.hasOptions() && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={userAccessLevel}
              >
                <GenericDropdownButton
                  className="dropdown-btn"
                  variant="outline-primary"
                  size="sm"
                  label={
                    isProcessingTerritory ? (
                      <>
                        <Spinner size="sm" />{" "}
                        {t("territory.territory", "Territory")}
                      </>
                    ) : (
                      t("territory.territory", "Territory")
                    )
                  }
                  align={{ lg: "end" }}
                >
                  <GenericDropdownItem
                    onClick={() =>
                      showModal(NewTerritoryCode, {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode
                      })
                    }
                  >
                    {t("territory.createNew", "Create New")}
                  </GenericDropdownItem>
                  <GenericDropdownItem
                    onClick={async () => {
                      const updatedCode = await showModal(ChangeTerritoryCode, {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode,
                        territoryCode: selectedTerritory.code,
                        territoryId: selectedTerritory.id
                      });
                      setSelectedTerritory((prev) => ({
                        ...prev,
                        code: updatedCode as string
                      }));
                      setTerritories(
                        new Map<string, territoryDetails>(
                          Array.from(territories).map(([key, value]) => {
                            if (key === selectedTerritory.id) {
                              value.code = updatedCode as string;
                            }
                            return [key, value];
                          })
                        )
                      );
                    }}
                  >
                    {t("territory.changeCode", "Change Code")}
                  </GenericDropdownItem>
                  <GenericDropdownItem
                    onClick={async () => {
                      const updatedName = await showModal(ChangeTerritoryName, {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode,
                        territoryCode: selectedTerritory.id,
                        name: selectedTerritory.name
                      });
                      setSelectedTerritory((prev) => ({
                        ...prev,
                        name: updatedName as string
                      }));
                      setTerritories(
                        new Map<string, territoryDetails>(
                          Array.from(territories).map(([key, value]) => {
                            if (key === selectedTerritory.id) {
                              value.name = updatedName as string;
                            }
                            return [key, value];
                          })
                        )
                      );
                    }}
                  >
                    {t("territory.changeName", "Change Name")}
                  </GenericDropdownItem>
                  <GenericDropdownItem
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        t(
                          "territory.deleteWarning",
                          '⚠️ WARNING: Deleting territory "{{code}}" will remove all associated maps and assignments. This action cannot be undone. Proceed?',
                          { code: selectedTerritory.code }
                        )
                      );

                      if (confirmDelete) {
                        deleteTerritory();
                      }
                    }}
                  >
                    {t("territory.deleteCurrent", "Delete Current")}
                  </GenericDropdownItem>
                  <GenericDropdownItem
                    onClick={() => {
                      const confirmReset = window.confirm(
                        t(
                          "territory.resetWarning",
                          '⚠️ WARNING: Resetting territory "{{code}}" will reset the status of all addresses. This action cannot be undone. Proceed?',
                          { code: selectedTerritory.code }
                        )
                      );

                      if (confirmReset) {
                        resetTerritory();
                      }
                    }}
                  >
                    {t("territory.resetStatus", "Reset status")}
                  </GenericDropdownItem>
                </GenericDropdownButton>
              </ComponentAuthorizer>
            )}
            {selectedTerritory.code && policy.hasOptions() && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={userAccessLevel}
              >
                <GenericDropdownButton
                  className="dropdown-btn"
                  variant="outline-primary"
                  size="sm"
                  label={t("map.newMap", "New Map")}
                  align={{ lg: "end" }}
                >
                  <GenericDropdownItem
                    onClick={() =>
                      showModal(NewSingleMap, {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode,
                        territoryCode: selectedTerritory.id,
                        defaultType: policy.defaultType,
                        origin: policy.origin
                      })
                    }
                  >
                    {t("map.multiStory", "Multi-story")}
                  </GenericDropdownItem>
                  <GenericDropdownItem
                    onClick={() =>
                      showModal(NewMultiMap, {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode,
                        territoryCode: selectedTerritory.id,
                        defaultType: policy.defaultType,
                        origin: policy.origin
                      })
                    }
                  >
                    {t("map.singleStory", "Single-Story")}
                  </GenericDropdownItem>
                </GenericDropdownButton>
              </ComponentAuthorizer>
            )}
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={userAccessLevel}
            >
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
                <GenericDropdownItem onClick={handleShowCongregationSettings}>
                  {t("congregation.settings", "Settings")}
                </GenericDropdownItem>
                <GenericDropdownItem onClick={handleShowCongregationOptions}>
                  {t("congregation.householdOptions", "Household Options")}
                </GenericDropdownItem>
                <GenericDropdownItem onClick={handleManageUsers}>
                  {t("user.manageUsers", "Manage Users")}
                </GenericDropdownItem>
                <GenericDropdownItem onClick={handleInviteUser}>
                  {t("user.inviteUser", "Invite User")}
                </GenericDropdownItem>
              </GenericDropdownButton>
            </ComponentAuthorizer>
            <GenericDropdownButton
              className="dropdown-btn"
              size="sm"
              variant="outline-primary"
              label={t("user.account", "Account")}
              align={{ lg: "end" }}
            >
              <GenericDropdownItem onClick={handleShowProfile}>
                {t("user.profile", "Profile")}
              </GenericDropdownItem>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                userPermission={userAccessLevel}
              >
                <GenericDropdownItem onClick={handleShowAssignments}>
                  {t("assignments.assignments", "Assignments")}
                </GenericDropdownItem>
              </ComponentAuthorizer>
              <GenericDropdownItem onClick={handlePasswordReset}>
                {t("auth.changePassword", "Change Password")}
              </GenericDropdownItem>
              <GenericDropdownItem onClick={logoutUser}>
                {t("auth.logout", "Logout")}
              </GenericDropdownItem>
            </GenericDropdownButton>
            <ThemeToggle className="m-1" />
            <GenericButton
              className="m-1"
              size="sm"
              variant="outline-primary"
              onClick={toggleLanguageSelector}
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
      {!selectedTerritory.code && <Welcome name={userName} />}
      {selectedTerritory.code && (
        <div className="territory-content">
          <TerritoryHeader name={selectedTerritory.name} />
          {isMapView ? (
            <MapView
              key={`mapview-${selectedTerritory.id}`}
              sortedAddressList={sortedAddressList}
              policy={policy}
            />
          ) : (
            <MapListing
              key={`maplist-${selectedTerritory.id}`}
              sortedAddressList={sortedAddressList}
              accordingKeys={accordingKeys}
              setAccordionKeys={setAccordionKeys}
              mapViews={mapViews}
              setMapViews={setMapViews}
              policy={policy}
              values={values}
              setValues={setValues}
              userAccessLevel={
                userAccessLevel || USER_ACCESS_LEVELS.NO_ACCESS.CODE
              }
              isReadonly={isReadonly}
              deleteMap={deleteMap}
              addFloorToMap={addFloorToMap}
              resetMap={resetMap}
              processingMap={processingMap}
              toggleAddressTerritoryListing={toggleAddressTerritoryListing}
            />
          )}
        </div>
      )}
      {selectedTerritory.code && (
        <>
          <SpeedDial
            actions={[
              {
                icon: <ModeToggle isMapView={isMapView} />,
                label: isMapView
                  ? t("navigation.listView")
                  : t("navigation.mapView"),
                onClick: () => setIsMapView(!isMapView)
              },
              {
                icon: isAssignmentLoading ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    aria-hidden="true"
                  />
                ) : (
                  <Image
                    src={getAssetUrl("stars.svg")}
                    alt="stars"
                    width={24}
                    height={24}
                  />
                ),
                label: t("navigation.generateLink"),
                onClick: handleGenerateTerritoryMap,
                keepOpen: true
              }
            ]}
            direction="up"
          />
          <BackToTopButton showButton={showBkTopButton} />
        </>
      )}
    </>
  );
}

export default Admin;
