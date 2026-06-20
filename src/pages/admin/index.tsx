import "../../css/admin.css";

import { useEffect, useRef, use, lazy } from "react";
import { useTranslation } from "react-i18next";
import {
  adminProps,
  userDetails,
  valuesDetails,
  addressDetails,
  TerritoryPolygonCoordinate,
  HHOptionProps
} from "../../utils/interface";
import { LinkSession, Policy } from "../../utils/policies";
import { sortByCode } from "../../utils/helpers/sorthelpers";
import {
  USER_ACCESS_LEVELS,
  DEFAULT_CONGREGATION_MAX_TRIES,
  PB_FIELDS,
  DEFAULT_REPORT_ROLLING_DAYS
} from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import useTerritoryManagement from "../../hooks/useTerritoryManagement";
import useMapManagement from "../../hooks/useMapManagement";
import useCongregationManagement from "../../hooks/useCongManagement";
import useUIState from "../../hooks/useUIManagement";
import useRealtimeSubscription from "../../hooks/useRealtime";
import { useModalManagement } from "../../hooks/useModalManagement";
import useAdminData from "../../hooks/useAdminData";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import useLaunchDarklyContext from "../../hooks/useLaunchDarklyContext";

import TerritoryListing from "../../components/navigation/territorylist";
import UserListing from "../../components/navigation/userlist";
import Loader from "../../components/statics/loader";
import SuspenseComponent from "../../components/utils/suspense";
import CongListing from "../../components/navigation/conglist";
import LanguageSelector from "../../i18n/LanguageSelector";
import { LanguageContext } from "../../i18n/LanguageContext";
import {
  cleanupSession,
  getList,
  getUser,
  requestPasswordReset
} from "../../utils/pocketbase";
import useOnSSEReconnect from "../../hooks/useOnSSEReconnect";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AdminNavbar from "./components/adminnavbar";
import { AppSidebar } from "./components/appsidebar";
import BackToTopButton from "../../components/navigation/backtotop";
import { useSmartSync, SmartSyncProvider } from "../../hooks/useSmartSync";

const TerritoryContent = SuspenseComponent(
  lazy(() => import("./components/territorycontent"))
);

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
const ChangeTerritoryDetails = lazy(
  () => import("../../components/modal/changeterritorydetails")
);
const QuickLinkModal = lazy(
  () => import("../../components/modal/getquicklink")
);
const ChangeTerritoryMapSequence = lazy(
  () => import("../../components/modal/territorymapsequence")
);
const ConfigureTerritoryCoordinates = lazy(
  () => import("../../components/modal/changeterritorycoordinates")
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
    accordionKeys,
    setAccordionKeys,
    mapViews,
    setMapViews,
    isMapView,
    setIsMapView,
    deleteMap,
    addFloorToMap,
    resetMap,
    processMapRecord,
    setupMaps,
    handleAddressTerritorySelect: mapHandleAddressTerritorySelect
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
    handleCongregationSelect,
    generateReport
  } = useCongregationManagement({ userId });

  useLaunchDarklyContext(userCongregationAccesses, congregationCode);

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
    clearTerritorySelection,
    updateTerritoryCode,
    updateTerritoryName
  } = useTerritoryManagement();

  const {
    showBkTopButton,
    setShowBkTopButton,
    isUnauthorised,
    setIsUnauthorised,
    showChangeAddressTerritory,
    showLanguageSelector,
    values,
    setValues,
    isAssignmentLoading,
    setIsAssignmentLoading,
    toggleAddressTerritoryListing,
    toggleLanguageSelector
  } = useUIState();

  const { showModal } = useModalManagement();
  const { trackEvent } = useAnalytics();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);

  const {
    fetchData,
    loadAllCongregationData,
    checkForMaps,
    isLoading,
    hasAnyMaps,
    setHasAnyMaps
  } = useAdminData({
    userId,
    congregationCodeCache,
    congregationAccessRef: congregationAccess,
    setUserCongregationAccesses,
    setCongregationCode,
    setCongregationCodeCache,
    setCongregationName,
    setDefaultExpiryHours,
    setPolicy,
    setTerritories,
    setSelectedTerritory,
    setTerritoryCodeCache,
    setUserAccessLevel,
    setIsUnauthorised,
    notifyError,
    notifyWarning,
    processCongregationTerritories,
    territoryCodeCache,
    userEmail,
    t
  });

  const logoutUser = () => cleanupSession();

  // Tracks which territory ID had setupMaps fired directly in the event handler,
  // so the subsequent useEffect can skip the duplicate call and avoid re-fetching.
  const setupMapsFiredForRef = useRef<string>("");
  const isScrollingToTopRef = useRef(false);

  // Calls setupMaps immediately inside the user-gesture event handler so Safari
  // doesn't defer the fetch until after the sheet-close CSS animation finishes.
  const handleTerritorySelectWithSetup = (
    id: string | null,
    _: React.SyntheticEvent<unknown>
  ) => {
    if (!id) return;
    setupMapsFiredForRef.current = id;
    void setupMaps(id);
    handleTerritorySelect(id);
  };

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
      return new Map<string, userDetails>(
        existingUsers.set(userKey, { ...details, role: updatedRole as string })
      );
    });
  };

  const handleLanguageSelect = (lang: string) => {
    changeLanguage(lang);
    trackEvent(ANALYTICS_EVENTS.LANGUAGE_CHANGED, { language: lang });
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

  const handleGenerateTerritoryMap = () => {
    showModal(QuickLinkModal, { territoryId: selectedTerritory.id });
  };

  const handleAddressTerritorySelect = async (
    newTerritoryId: string | null
  ) => {
    await mapHandleAddressTerritorySelect(
      newTerritoryId,
      values as valuesDetails,
      selectedTerritory.id,
      territories,
      toggleAddressTerritoryListing
    );
  };

  const toggleCongregation = (selectedCode: string | null) => {
    handleCongregationSelect(selectedCode);
    clearTerritorySelection();
    loadAllCongregationData(selectedCode);
  };

  const handleShowCongregationSettings = async () => {
    const result = await showModal(UpdateCongregationSettings, {
      currentName: congregationName,
      currentCongregation: congregationCode,
      currentMaxTries: policy?.maxTries || DEFAULT_CONGREGATION_MAX_TRIES,
      currentDefaultExpiryHrs: defaultExpiryHours
    });
    if (result) {
      const { name, maxTries, defaultExpiryHrs } = result as {
        name: string;
        maxTries: number;
        defaultExpiryHrs: number;
      };
      setCongregationName(name);
      document.title = name;
      setDefaultExpiryHours(defaultExpiryHrs);
      setPolicy(
        new Policy(
          userName,
          policy.options,
          maxTries,
          policy.origin,
          userAccessLevel ?? "",
          defaultExpiryHrs,
          congregationCode
        )
      );
    }
  };

  const handleShowCongregationOptions = async () => {
    const updatedOptions = await showModal(UpdateCongregationOptions, {
      currentCongregation: congregationCode
    });
    if (updatedOptions && Array.isArray(updatedOptions)) {
      setPolicy(
        new Policy(
          userName,
          updatedOptions as HHOptionProps[],
          policy.maxTries,
          policy.origin,
          userAccessLevel ?? "",
          policy.defaultExpiryHours,
          congregationCode
        )
      );
    }
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

  const handleGenerateReport = async () => {
    const confirmed = await confirm({
      title: t("congregation.generateReport", "Generate Report"),
      message: t(
        "congregation.generateReportConfirm",
        "An activity report for the past {{days}} days will be generated and sent to you via email.",
        { days: DEFAULT_REPORT_ROLLING_DAYS }
      ),
      confirmText: t("common.proceed", "Proceed"),
      variant: "primary",
      focusConfirm: true
    });
    if (confirmed) await generateReport();
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
      congregation: congregationCode,
      origin: policy.origin
    });
  };

  const handleChangeDetails = async () => {
    const result = await showModal(ChangeTerritoryDetails, {
      footerSaveAcl: userAccessLevel,
      congregation: congregationCode,
      territoryCode: selectedTerritory.code,
      territoryId: selectedTerritory.id,
      name: selectedTerritory.name
    });
    if (result) {
      const { code, name } = result as { code: string; name: string };
      updateTerritoryCode(selectedTerritory.id, code);
      updateTerritoryName(selectedTerritory.id, name);
    }
  };

  const handleChangeSequence = () => {
    showModal(ChangeTerritoryMapSequence, {
      footerSaveAcl: userAccessLevel,
      territoryId: selectedTerritory.id
    });
  };

  const handleChangeLocation = async () => {
    const selectedTerritoryData = territories.get(selectedTerritory.id);
    const result = await showModal(ConfigureTerritoryCoordinates, {
      territoryId: selectedTerritory.id,
      territoryName: selectedTerritory.name,
      coordinates: selectedTerritoryData?.coordinates || [],
      origin: policy.origin,
      footerSaveAcl: userAccessLevel
    });

    // Only refresh if coordinates were actually saved (not cancelled)
    if (result !== undefined) {
      setTerritories((prev) => {
        const updated = new Map(prev);
        const territory = updated.get(selectedTerritory.id);
        if (territory) {
          updated.set(selectedTerritory.id, {
            ...territory,
            coordinates: result as TerritoryPolygonCoordinate
          });
        }
        return updated;
      });
    }
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
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentionally run on mount only
  }, []);

  const BACK_TO_TOP_THRESHOLD = 300;

  useEffect(() => {
    isScrollingToTopRef.current = false;
    setShowBkTopButton(false);
    if (!selectedTerritory.id) return;

    let container: Element | null = null;
    let mutObs: MutationObserver | undefined;

    const handleContainerScroll = () => {
      if (!container) return;
      const scrollTop = container.scrollTop;
      if (isScrollingToTopRef.current) {
        if (scrollTop <= BACK_TO_TOP_THRESHOLD)
          isScrollingToTopRef.current = false;
        return;
      }
      setShowBkTopButton(scrollTop > BACK_TO_TOP_THRESHOLD);
    };

    const attachScroll = (nextContainer: Element) => {
      container = nextContainer;
      container.addEventListener("scroll", handleContainerScroll, {
        passive: true
      });
    };

    // Container may already exist (cached lazy chunk / territory re-select)
    const existing = document.querySelector(".virtual-map-container");
    if (existing) {
      attachScroll(existing);
    } else {
      // Container not yet in DOM (lazy chunk loading) — observe until it appears
      mutObs = new MutationObserver(() => {
        const nextContainer = document.querySelector(".virtual-map-container");
        if (!nextContainer) return;
        mutObs?.disconnect();
        attachScroll(nextContainer);
      });
      mutObs.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      mutObs?.disconnect();
      container?.removeEventListener("scroll", handleContainerScroll);
    };
  }, [selectedTerritory.id, setShowBkTopButton]);

  const checkMapsOnRealtimeUpdate = () => {
    checkForMaps(congregationCode);
  };

  useOnSSEReconnect(() => {
    if (selectedTerritory.id) {
      void setupMaps(selectedTerritory.id);
    } else {
      fetchData();
    }
  });

  useRealtimeSubscription(
    "territories",
    (data) => {
      const territoryData = data.record;
      setTerritories((prev) => {
        if (data.action === "delete") {
          if (!prev.has(territoryData.id)) return prev; // bail out — already gone
          const updated = new Map(prev);
          updated.delete(territoryData.id);
          return updated;
        }
        const updated = new Map(prev);
        updated.set(territoryData.id, {
          id: territoryData.id,
          code: territoryData.code,
          name: territoryData.description,
          aggregates: territoryData.progress,
          coordinates: territoryData.coordinates
        });
        return new Map(
          sortByCode(Array.from(updated.values())).map((v) => [v.id, v])
        );
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
    // Skip if setupMaps was already fired in the gesture handler for this ID
    if (setupMapsFiredForRef.current === selectedTerritory.id) {
      setupMapsFiredForRef.current = "";
    } else {
      setupMaps(selectedTerritory.id);
    }
    const selectedTerritoryData = territories.get(selectedTerritory.id);
    setSelectedTerritory((prev) => ({
      ...prev,
      code: selectedTerritoryData?.code,
      name: selectedTerritoryData?.name
    }));
    return () => {
      setSortedAddressList([]);
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes dependencies; territories read via closure
  }, [selectedTerritory.id]);

  useRealtimeSubscription(
    "maps",
    (data) => {
      const mapId = data.record.id;
      const dataAction = data.action;
      setSortedAddressList((prevList) => {
        let updatedList: addressDetails[];
        if (dataAction === "update") {
          updatedList = prevList.map((map) =>
            map.id === mapId ? processMapRecord(data.record) : map
          );
        } else if (dataAction === "create") {
          updatedList = [...prevList, processMapRecord(data.record)];
        } else if (dataAction === "delete") {
          updatedList = prevList.filter((address) => address.id !== mapId);
        } else {
          return prevList;
        }
        return [...updatedList].sort((a, b) => a.sequence - b.sequence);
      });
      if (dataAction === "create") {
        setAccordionKeys((prev) => [...prev, mapId]);
        setHasAnyMaps(true); // map was just created, no need to query
      } else if (dataAction === "delete") {
        checkMapsOnRealtimeUpdate(); // recheck — may have deleted the last map
      }
    },
    {
      filter: `territory="${selectedTerritory.id}"`,
      fields: PB_FIELDS.MAPS
    },
    [selectedTerritory.id],
    !!selectedTerritory.id
  );

  const smartSync = useSmartSync(
    policy.congregation ? { congregationId: policy.congregation } : undefined
  );
  const { displayPendingCount } = smartSync;

  if (isUnauthorised) {
    return <UnauthorizedPage handleClick={logoutUser} />;
  }
  const isReadonly = userAccessLevel === USER_ACCESS_LEVELS.READ_ONLY.CODE;

  return (
    <SidebarProvider>
      <TerritoryListing
        showListing={showTerritoryListing}
        territories={congregationTerritoryList}
        selectedTerritory={selectedTerritory.code}
        selectedTerritoryId={selectedTerritory.id}
        hideFunction={toggleTerritoryListing}
        handleSelect={handleTerritorySelectWithSetup}
        congregationCode={congregationCode}
      />
      <TerritoryListing
        showListing={showChangeAddressTerritory}
        territories={congregationTerritoryList}
        selectedTerritory={selectedTerritory.code}
        selectedTerritoryId={selectedTerritory.id}
        hideFunction={toggleAddressTerritoryListing}
        handleSelect={handleAddressTerritorySelect}
        hideSelectedTerritory={true}
        congregationCode={congregationCode}
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
      <AppSidebar
        congregationName={congregationName}
        userName={userName}
        userEmail={userEmail}
        userCongregationAccesses={userCongregationAccesses}
        congregationTerritoryList={congregationTerritoryList}
        selectedTerritory={selectedTerritory}
        territories={territories}
        policy={policy}
        userAccessLevel={userAccessLevel}
        isProcessingTerritory={isProcessingTerritory}
        isShowingUserListing={isShowingUserListing}
        pendingCount={displayPendingCount}
        onToggleCongregationListing={toggleCongregationListing}
        onToggleTerritoryListing={toggleTerritoryListing}
        onToggleLanguageSelector={toggleLanguageSelector}
        onCreateTerritory={handleCreateTerritory}
        onTerritoryActions={{
          onCreateNew: handleCreateTerritory,
          onChangeDetails: handleChangeDetails,
          onChangeLocation: handleChangeLocation,
          onChangeSequence: handleChangeSequence,
          onDelete: handleDeleteTerritory,
          onReset: handleResetTerritory
        }}
        onCongregationActions={{
          onShowSettings: handleShowCongregationSettings,
          onShowOptions: handleShowCongregationOptions,
          onManageUsers: handleManageUsers,
          onInviteUser: handleInviteUser,
          onGenerateReport: handleGenerateReport
        }}
        onAccountActions={{
          onShowProfile: handleShowProfile,
          onShowAssignments: handleShowAssignments,
          onPasswordReset: handlePasswordReset,
          onLogout: logoutUser
        }}
      />
      <SidebarInset className="min-w-0">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <AdminNavbar
              congregationName={congregationName}
              pendingCount={displayPendingCount}
            />
            <SmartSyncProvider value={smartSync}>
              <TerritoryContent
                selectedTerritory={selectedTerritory}
                userName={userName}
                isMapView={isMapView}
                isAssignmentLoading={isAssignmentLoading}
                onToggleMapView={() => setIsMapView(!isMapView)}
                onGenerateLink={handleGenerateTerritoryMap}
                sortedAddressList={sortedAddressList}
                accordionKeys={accordionKeys}
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
                onCreateMap={handleCreateMap}
              />
              <BackToTopButton
                showButton={showBkTopButton && !isMapView}
                onScrollToTop={() => {
                  isScrollingToTopRef.current = true;
                  setShowBkTopButton(false);
                  document
                    .querySelector(".virtual-map-container")
                    ?.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </SmartSyncProvider>
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Admin;
