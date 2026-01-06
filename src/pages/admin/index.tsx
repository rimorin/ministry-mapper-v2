import "../../css/admin.css";

import { useEffect, use, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminProps,
  territoryDetails,
  userDetails,
  valuesDetails,
  addressDetails
} from "../../utils/interface";
import { LinkSession } from "../../utils/policies";
import {
  USER_ACCESS_LEVELS,
  DEFAULT_CONGREGATION_MAX_TRIES,
  PB_FIELDS
} from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import useTerritoryManagement from "../../hooks/useTerritoryManagement";
import useMapManagement from "../../hooks/useMapManagement";
import useCongregationManagement from "../../hooks/useCongManagement";
import useUIState from "../../hooks/useUIManagement";
import useRealtimeSubscription from "../../hooks/useRealtime";
import useVisibilityChange from "../../hooks/useVisibilityManagement";
import { useModalManagement } from "../../hooks/useModalManagement";
import useAdminData from "../../hooks/useAdminData";

import TerritoryListing from "../../components/navigation/territorylist";
import UserListing from "../../components/navigation/userlist";
import Loader from "../../components/statics/loader";
import SuspenseComponent from "../../components/utils/suspense";
import CongListing from "../../components/navigation/conglist";
import LanguageSelector from "../../i18n/LanguageSelector";
import { LanguageContext } from "../../i18n/LanguageContext";
import {
  cleanupSession,
  callFunction,
  getList,
  getUser,
  requestPasswordReset
} from "../../utils/pocketbase";

import AdminNavbar from "./components/adminnavbar";
import TerritoryContent from "./components/territorycontent";
import FloatingActions from "./components/floatingactions";

const UnauthorizedPage = SuspenseComponent(
  lazy(() => import("../../components/statics/unauth"))
);
const UpdateUser = lazy(() => import("../../components/modal/updateuser"));
const UpdateCongregationSettings = lazy(
  () => import("../../components/modal/congsettings")
);
const UpdateCongregationOptions = lazy(
  () => import("../../components/modal/congoptions")
);
const NewTerritoryCode = lazy(
  () => import("../../components/modal/newterritorycd")
);
const NewMap = lazy(() => import("../../components/modal/newmap"));
const InviteUser = lazy(() => import("../../components/modal/inviteuser"));
const GetProfile = lazy(() => import("../../components/modal/profile"));
const GetAssignments = lazy(() => import("../../components/modal/assignments"));
const ChangeTerritoryName = lazy(
  () => import("../../components/modal/changeterritoryname")
);
const ChangeTerritoryCode = lazy(
  () => import("../../components/modal/changeterritorycd")
);
const QuickLinkModal = lazy(
  () => import("../../components/modal/getquicklink")
);
const ChangeTerritoryMapSequence = lazy(
  () => import("../../components/modal/territorymapsequence")
);

function Admin({ user }: adminProps) {
  const { t } = useTranslation();
  const { notifyError, notifyWarning } = useNotification();
  const { confirm } = useConfirm();
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

  const [hasAnyMaps, setHasAnyMaps] = useState<boolean>(false);

  const { showModal } = useModalManagement();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);

  const { fetchData, fetchCongregationData } = useAdminData({
    userId,
    congregationCodeCache,
    congregationAccess,
    setUserCongregationAccesses,
    setCongregationCode,
    setCongregationCodeCache,
    setCongregationName,
    setDefaultExpiryHours,
    setPolicy,
    setTerritories,
    setSelectedTerritory,
    setTerritoryCodeCache,
    setIsLoading,
    setIsUnauthorised,
    notifyError,
    notifyWarning,
    processCongregationTerritories,
    territoryCodeCache,
    userEmail,
    t
  });

  const logoutUser = () => cleanupSession();

  const handleUserSelect = async (userKey: string | null) => {
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
      return new Map<string, userDetails>(existingUsers.set(userKey, details));
    });
  };

  const handleLanguageSelect = (lang: string) => {
    changeLanguage(lang);
    toggleLanguageSelector();
  };

  const getAssignments = async (code: string, uid: string) => {
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
        notifyWarning(
          t("assignments.noAssignmentsFound", "No assignments found.")
        );
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
  };

  const handleGenerateTerritoryMap = async () => {
    setIsAssignmentLoading(true);
    try {
      showModal(QuickLinkModal, {
        territoryId: selectedTerritory.id
      });
    } finally {
      setIsAssignmentLoading(false);
    }
  };

  const handleAddressTerritorySelect = async (
    newTerritoryId: string | null
  ) => {
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
      notifyWarning(
        t(
          "territory.changeSuccess",
          "Territory {{code}} updated successfully.",
          { code: newTerritoryCode }
        )
      );
    } catch (error) {
      notifyError(error);
    }
  };

  const setupMaps = async (territoryId: string) => {
    if (!territoryId) return;
    const maps = await getList("maps", {
      filter: `territory="${territoryId}"`,
      requestKey: null,
      sort: "sequence",
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
  };

  const toggleCongregation = (selectedCode: string | null) => {
    handleCongregationSelect(selectedCode);
    clearTerritorySelection();
  };

  const handleShowCongregationSettings = () => {
    showModal(UpdateCongregationSettings, {
      currentName: congregationName,
      currentCongregation: congregationCode,
      currentMaxTries: policy?.maxTries || DEFAULT_CONGREGATION_MAX_TRIES,
      currentDefaultExpiryHrs: defaultExpiryHours
    });
  };

  const handleShowCongregationOptions = () => {
    showModal(UpdateCongregationOptions, {
      currentCongregation: congregationCode
    });
  };

  const handleManageUsers = async () => {
    await getUsers();
  };

  const handleInviteUser = () => {
    showModal(InviteUser, {
      uid: userId,
      congregation: congregationCode,
      footerSaveAcl: userAccessLevel
    });
  };

  const handleShowProfile = () => {
    showModal(GetProfile, {
      user: getUser()
    });
  };

  const handleShowAssignments = () => {
    getAssignments(congregationCode, getUser("id") as string);
  };

  const handlePasswordReset = async () => {
    await requestPasswordReset();
    notifyWarning(
      t("auth.passwordResetConfirmation", "Password reset email sent.")
    );
  };

  const handleCreateTerritory = () => {
    showModal(NewTerritoryCode, {
      footerSaveAcl: userAccessLevel,
      congregation: congregationCode
    });
  };

  const handleChangeCode = async () => {
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
  };

  const handleChangeName = async () => {
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
  };

  const handleChangeSequence = () => {
    showModal(ChangeTerritoryMapSequence, {
      footerSaveAcl: userAccessLevel,
      territoryId: selectedTerritory.id
    });
  };

  const handleDeleteTerritory = async () => {
    const confirmDelete = await confirm({
      title: t("common.confirmDelete", "Confirm Delete"),
      message: t(
        "territory.deleteWarning",
        'Territory "{{code}}" and all its maps and assignments will be permanently deleted.\nYou cannot undo this.',
        { code: selectedTerritory.code }
      ),
      confirmText: t("common.delete", "Delete"),
      variant: "danger"
    });

    if (confirmDelete) {
      deleteTerritory();
    }
  };

  const handleResetTerritory = async () => {
    const confirmReset = await confirm({
      title: t("common.confirmReset", "Confirm Reset"),
      message: t(
        "territory.resetWarning",
        'All address statuses in territory "{{code}}" will be reset to their default state.\nYou cannot undo this.',
        { code: selectedTerritory.code }
      ),
      confirmText: t("common.reset", "Reset"),
      variant: "warning"
    });

    if (confirmReset) {
      resetTerritory();
    }
  };

  const handleCreateMap = () => {
    showModal(NewMap, {
      footerSaveAcl: userAccessLevel,
      congregation: congregationCode,
      territoryCode: selectedTerritory.id,
      defaultType: policy.defaultType,
      origin: policy.origin
    });
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!congregationCode) return;

    const loadAllCongregationData = async () => {
      setIsLoading(true);
      setUserAccessLevel(congregationAccess.current[congregationCode]);

      // Load congregation data and get territories
      const loadedTerritories = await fetchCongregationData(congregationCode);

      // Check for maps with the loaded territories
      if (loadedTerritories) {
        await checkForMaps(loadedTerritories);
      }

      // All data loaded
      setIsLoading(false);
    };

    loadAllCongregationData();
  }, [congregationCode]);

  const checkForMaps = async (territoryMap?: Map<string, territoryDetails>) => {
    // Use provided map or fall back to state (for realtime updates)
    const mapToCheck = territoryMap || territories;

    if (mapToCheck.size === 0) {
      setHasAnyMaps(false);
      return;
    }

    try {
      const territoryIds = Array.from(mapToCheck.keys());
      const filterConditions = territoryIds
        .map((id) => `territory="${id}"`)
        .join(" || ");

      const maps = await getList("maps", {
        filter: filterConditions,
        requestKey: null,
        fields: "id"
      });
      setHasAnyMaps(maps.length > 0);
    } catch {
      setHasAnyMaps(false);
    }
  };

  useRealtimeSubscription(
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
      fields: PB_FIELDS.TERRITORIES
    },
    [congregationCode],
    !!congregationCode
  );

  useEffect(() => {
    if (!selectedTerritory.id) return;
    setupMaps(selectedTerritory.id);
    const selectedTerritoryData = territories.get(selectedTerritory.id);
    setSelectedTerritory((prev) => ({
      ...prev,
      code: selectedTerritoryData?.code,
      name: selectedTerritoryData?.name
    }));
    return () => {
      setSortedAddressList([]);
    };
  }, [selectedTerritory.id]);

  useRealtimeSubscription(
    "maps",
    (data) => {
      const mapId = data.record.id;
      const dataAction = data.action;
      setSortedAddressList((prevList) => {
        let updatedList: addressDetails[] = [];
        if (dataAction === "update") {
          updatedList = prevList.map((map) =>
            map.id === mapId ? processMapRecord(data.record) : map
          );
        } else if (dataAction === "create") {
          updatedList = [...prevList, processMapRecord(data.record)];
        } else if (dataAction === "delete") {
          updatedList = prevList.filter((address) => address.id !== mapId);
        }
        updatedList.sort((a, b) => a.sequence - b.sequence);
        return updatedList;
      });
      if (dataAction === "create") {
        setAccordionKeys((prev) => [...prev, mapId]);
      }
      // Recheck for maps when maps are created/deleted
      if (dataAction === "create" || dataAction === "delete") {
        checkForMaps();
      }
    },
    {
      filter: `territory="${selectedTerritory.id}"`,
      fields: PB_FIELDS.MAPS
    },
    [selectedTerritory.id],
    !!selectedTerritory.id
  );

  useVisibilityChange(() => setupMaps(selectedTerritory.id));

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
      <AdminNavbar
        congregationName={congregationName}
        userCongregationAccesses={userCongregationAccesses}
        congregationTerritoryList={congregationTerritoryList}
        selectedTerritory={selectedTerritory}
        territories={territories}
        policy={policy}
        userAccessLevel={userAccessLevel}
        isProcessingTerritory={isProcessingTerritory}
        isShowingUserListing={isShowingUserListing}
        onToggleCongregationListing={toggleCongregationListing}
        onToggleTerritoryListing={toggleTerritoryListing}
        onToggleLanguageSelector={toggleLanguageSelector}
        onCreateTerritory={handleCreateTerritory}
        onTerritoryActions={{
          onCreateNew: handleCreateTerritory,
          onChangeCode: handleChangeCode,
          onChangeName: handleChangeName,
          onChangeSequence: handleChangeSequence,
          onDelete: handleDeleteTerritory,
          onReset: handleResetTerritory
        }}
        onCreateMap={handleCreateMap}
        onCongregationActions={{
          onShowSettings: handleShowCongregationSettings,
          onShowOptions: handleShowCongregationOptions,
          onManageUsers: handleManageUsers,
          onInviteUser: handleInviteUser
        }}
        onAccountActions={{
          onShowProfile: handleShowProfile,
          onShowAssignments: handleShowAssignments,
          onPasswordReset: handlePasswordReset,
          onLogout: logoutUser
        }}
      />
      <TerritoryContent
        selectedTerritory={selectedTerritory}
        userName={userName}
        isMapView={isMapView}
        sortedAddressList={sortedAddressList}
        accordingKeys={accordingKeys}
        setAccordionKeys={setAccordionKeys}
        mapViews={mapViews}
        setMapViews={setMapViews}
        policy={policy}
        values={values}
        setValues={setValues}
        userAccessLevel={userAccessLevel}
        isReadonly={isReadonly}
        deleteMap={deleteMap}
        addFloorToMap={addFloorToMap}
        resetMap={resetMap}
        processingMap={processingMap}
        toggleAddressTerritoryListing={toggleAddressTerritoryListing}
        congregationOptions={policy.options}
        territories={territories}
        onCreateOptions={handleShowCongregationOptions}
        onCreateTerritory={handleCreateTerritory}
        hasAnyMaps={hasAnyMaps}
      />
      {selectedTerritory.code && (
        <FloatingActions
          showBkTopButton={showBkTopButton}
          isMapView={isMapView}
          isAssignmentLoading={isAssignmentLoading}
          onToggleMapView={() => setIsMapView(!isMapView)}
          onGenerateLink={handleGenerateTerritoryMap}
        />
      )}
    </>
  );
}

export default Admin;
