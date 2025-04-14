import "../css/admin.css";

import { useEffect, useState, useCallback, useMemo, lazy, useRef } from "react";
import {
  Button,
  Container,
  Dropdown,
  DropdownButton,
  Navbar,
  Spinner
} from "react-bootstrap";

import { AuthRecord, RecordModel } from "pocketbase";

import {
  valuesDetails,
  territoryDetails,
  addressDetails,
  adminProps,
  userDetails,
  CongregationAccessObject
} from "../utils/interface";
import { LinkSession, Policy } from "../utils/policies";
import {
  DEFAULT_SELF_DESTRUCT_HOURS,
  USER_ACCESS_LEVELS,
  PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY,
  TERRITORY_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
  DEFAULT_COORDINATES,
  PB_FIELDS
} from "../utils/constants";
import errorHandler from "../utils/helpers/errorhandler";

import TerritoryListing from "../components/navigation/territorylist";
import UserListing from "../components/navigation/userlist";
import NavBarBranding from "../components/navigation/branding";
import AggregationBadge from "../components/navigation/aggrbadge";
import ComponentAuthorizer from "../components/navigation/authorizer";
import TerritoryHeader from "../components/navigation/territoryheader";
import BackToTopButton from "../components/navigation/backtotop";
import Loader from "../components/statics/loader";
import Welcome from "../components/statics/welcome";
import SuspenseComponent from "../components/utils/suspense";
import ModalManager from "@ebay/nice-modal-react";
import useLocalStorage from "../utils/helpers/storage";
import CongListing from "../components/navigation/conglist";
import getCongregationUsers from "../utils/helpers/getcongregationusers";
import useVisibilityChange from "../components/utils/visibilitychange";
import MapListing from "../components/navigation/maplist";
import MapView from "../components/navigation/mapview";
import ModeToggle from "../components/navigation/maptoggle";
import {
  cleanupSession,
  deleteDataById,
  callFunction,
  getList,
  getDataById,
  getUser,
  setupRealtimeListener,
  requestPasswordReset,
  unsubscriber
} from "../utils/pocketbase";

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

function Admin({ user }: adminProps) {
  const userId = user?.id as string;
  const userName = user?.name as string;
  const userEmail = user?.email as string;
  const [congregationCode, setCongregationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingTerritory, setIsProcessingTerritory] =
    useState<boolean>(false);
  const [processingMap, setProcessingMap] = useState<{
    isProcessing: boolean;
    mapId: string | null;
  }>({ isProcessing: false, mapId: null });

  const [isUnauthorised, setIsUnauthorised] = useState<boolean>(false);
  const [showBkTopButton, setShowBkTopButton] = useState(false);
  const [showTerritoryListing, setShowTerritoryListing] =
    useState<boolean>(false);
  const [showUserListing, setShowUserListing] = useState<boolean>(false);
  const [showCongregationListing, setShowCongregationListing] =
    useState<boolean>(false);
  const [isShowingUserListing, setIsShowingUserListing] =
    useState<boolean>(false);
  const [congregationUsers, setCongregationUsers] = useState(
    new Map<string, userDetails>()
  );
  const [showChangeAddressTerritory, setShowChangeAddressTerritory] =
    useState<boolean>(false);
  const [congregationName, setCongregationName] = useState<string>("");
  const [values, setValues] = useState<object>({});
  const [territories, setTerritories] = useState(
    new Map<string, territoryDetails>()
  );
  const [sortedAddressList, setSortedAddressList] = useState<
    Array<addressDetails>
  >([]);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>("");
  const [selectedTerritoryCode, setSelectedTerritoryCode] = useState<string>();
  const [selectedTerritoryName, setSelectedTerritoryName] = useState<string>();
  const [accordingKeys, setAccordionKeys] = useState<Array<string>>([]);
  const [userAccessLevel, setUserAccessLevel] = useState<string>();
  const [defaultExpiryHours, setDefaultExpiryHours] = useState<number>(
    DEFAULT_SELF_DESTRUCT_HOURS
  );
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [isAssignmentLoading, setIsAssignmentLoading] =
    useState<boolean>(false);
  const [userCongregationAccesses, setUserCongregationAccesses] = useState<
    CongregationAccessObject[]
  >([]);

  const congregationAccess = useRef<Record<string, string>>({});
  // create a useRef to store maps view mode if true/false
  const [mapViews, setMapViews] = useState<Map<string, boolean>>(new Map());

  const [congregationCodeCache, setCongregationCodeCache] = useLocalStorage(
    "congregationCode",
    ""
  );

  const [territoryCodeCache, setTerritoryCodeCache] = useLocalStorage(
    "territoryCode",
    ""
  );

  const [isMapView, setIsMapView] = useLocalStorage("mapView", false);

  const getUsers = useCallback(async () => {
    try {
      setIsShowingUserListing(true);
      setCongregationUsers(
        await getCongregationUsers(congregationCode, userId)
      );
      toggleUserListing();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsShowingUserListing(false);
    }
  }, [congregationCode]);

  const logoutUser = useCallback(() => cleanupSession(), []);

  const deleteTerritory = useCallback(async () => {
    if (!selectedTerritoryId) return;
    setIsProcessingTerritory(true);
    try {
      // kill all subscriptions before deleting
      unsubscriber(["maps", "addresses", "messages", "assignments"]);
      await deleteDataById("territories", selectedTerritoryId, {
        requestKey: `territory-del-${congregationCode}-${selectedTerritoryCode}`
      });
      alert(`Deleted territory, ${selectedTerritoryCode}.`);
      window.location.reload();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsProcessingTerritory(false);
    }
  }, [selectedTerritoryCode, congregationCode]);

  const deleteMap = useCallback(
    async (mapId: string, name: string, showAlert: boolean) => {
      setProcessingMap({ isProcessing: true, mapId: mapId });
      try {
        await deleteDataById("maps", mapId, {
          requestKey: `map-del-${mapId}`
        });
        if (showAlert) alert(`Deleted address, ${name}.`);
      } catch (error) {
        errorHandler(error);
      } finally {
        setProcessingMap({ isProcessing: false, mapId: null });
      }
    },
    [selectedTerritoryCode, congregationCode]
  );

  const addFloorToMap = useCallback(
    async (mapId: string, higherFloor = false) => {
      setProcessingMap({ isProcessing: true, mapId: mapId });
      try {
        await callFunction("/map/floor/add", {
          method: "POST",
          body: {
            map: mapId,
            add_higher: higherFloor
          }
        });
      } catch (error) {
        errorHandler(error);
      } finally {
        setProcessingMap({ isProcessing: false, mapId: null });
      }
    },
    []
  );

  const resetTerritory = useCallback(async () => {
    if (!selectedTerritoryCode) return;
    setIsProcessingTerritory(true);
    try {
      await callFunction("/territory/reset", {
        method: "POST",
        body: {
          territory: selectedTerritoryId
        }
      });
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsProcessingTerritory(false);
    }
  }, [selectedTerritoryCode, selectedTerritoryId]);

  const resetMap = useCallback(async (mapId: string) => {
    setProcessingMap({ isProcessing: true, mapId: mapId });
    try {
      await callFunction("/map/reset", {
        method: "POST",
        body: {
          map: mapId
        }
      });
    } catch (error) {
      errorHandler(error);
    } finally {
      setProcessingMap({ isProcessing: false, mapId: null });
    }
  }, []);

  const processCongregationTerritories = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (congregationTerritories: any) => {
      const territoryList = new Map<string, territoryDetails>();
      try {
        if (!congregationTerritories) return territoryList;
        for (const territory in congregationTerritories) {
          const name = congregationTerritories[territory]["description"];
          const id = congregationTerritories[territory]["id"];
          const code = congregationTerritories[territory]["code"];
          const progress = congregationTerritories[territory]["progress"];
          territoryList.set(id, {
            id: id,
            code: code,
            name: name,
            aggregates: progress
          });
        }
      } catch (error) {
        console.error("Error processing congregation territories: ", error);
      }
      return territoryList;
    },
    []
  );

  const handleTerritorySelect = useCallback(
    (eventKey: string | null) => {
      setSelectedTerritoryId(eventKey as string);
      setTerritoryCodeCache(eventKey as string);
      toggleTerritoryListing();
    },
    // Reset cache when the territory dropdown is selected

    [showTerritoryListing]
  );

  const toggleTerritoryListing = useCallback(() => {
    setShowTerritoryListing(!showTerritoryListing);
  }, [showTerritoryListing]);

  const handleUserSelect = useCallback(
    (userKey: string | null) => {
      if (!userKey) return;
      const details = congregationUsers.get(userKey);
      if (!details) return;
      ModalManager.show(SuspenseComponent(UpdateUser), {
        uid: userKey,
        congregation: congregationCode,
        footerSaveAcl: userAccessLevel,
        name: details.name,
        role: details.role
      }).then((updatedRole) => {
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
      });
    },
    [congregationUsers, congregationCode, userAccessLevel]
  );

  const toggleUserListing = useCallback(() => {
    setShowUserListing(!showUserListing);
  }, [showUserListing]);

  const toggleCongregationListing = useCallback(() => {
    setShowCongregationListing(!showCongregationListing);
  }, [showCongregationListing]);

  const handleAddressTerritorySelect = useCallback(
    async (newTerritoryId: string | null) => {
      const details = values as valuesDetails;
      const mapId = details.map as string;
      const newTerritoryCode = territories.get(newTerritoryId as string)?.code;
      setProcessingMap({ isProcessing: true, mapId: mapId });
      try {
        toggleAddressTerritoryListing();
        await callFunction("/map/territory/update", {
          method: "POST",
          body: {
            map: mapId,
            new_territory: newTerritoryId,
            old_territory: selectedTerritoryId
          }
        });
        setSortedAddressList(
          sortedAddressList.filter(
            (address) => address.id !== mapId
          ) as addressDetails[]
        );
        alert(
          `Changed territory of ${details.name} from ${selectedTerritoryCode} to ${newTerritoryCode}.`
        );
      } catch (error) {
        errorHandler(error);
      } finally {
        setProcessingMap({ isProcessing: false, mapId: null });
      }
    },
    [showChangeAddressTerritory, selectedTerritoryCode, values]
  );

  const toggleAddressTerritoryListing = useCallback(() => {
    setShowChangeAddressTerritory(!showChangeAddressTerritory);
  }, [showChangeAddressTerritory]);

  const congregationTerritoryList = useMemo(
    () => Array.from(territories.values()),
    [territories]
  );

  const handleCongregationSelect = useCallback(
    async (newCongCode: string | null) => {
      const congregationCode = newCongCode as string;
      setCongregationCodeCache(congregationCode);
      setCongregationCode(congregationCode);
      setCongregationName("");
      setSelectedTerritoryId("");
      setTerritoryCodeCache("");
      setSelectedTerritoryCode("");
      setSelectedTerritoryName("");
      toggleCongregationListing();
    },
    [showCongregationListing]
  );

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
        alert("No assignments found.");
        return;
      }

      const linkListing = new Array<LinkSession>();
      assignments.forEach((link) => {
        linkListing.push(new LinkSession(link, link.id));
      });

      ModalManager.show(SuspenseComponent(GetAssignments), {
        assignments: linkListing,
        congregation: code
      });
    } finally {
      setIsAssignmentLoading(false);
    }
  }, []);

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

    const congregationAccesses: CongregationAccessObject[] = userRoles.map(
      (record) => {
        return {
          code: record.expand?.congregation.id,
          access: record.role,
          name: record.expand?.congregation.name
        };
      }
    );
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
  }, []);

  const handleScroll = useCallback(() => {
    setShowBkTopButton(window.scrollY > PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY);
  }, []);

  const fetchCongregationData = useCallback(
    async (congregationCode: string) => {
      const congDetails = await getDataById("congregations", congregationCode, {
        requestKey: `congregation-${congregationCode}`
      });

      if (!congDetails) {
        alert("Congregation not found.");
        return;
      }

      const congOptions = await getList("options", {
        filter: `congregation="${congregationCode}"`,
        requestKey: `congregation-options-${congregationCode}`,
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
          congOptions?.map((option: RecordModel) => {
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
          congregationAccess.current[congregationCode],
          congDetails.expiry_hours || DEFAULT_SELF_DESTRUCT_HOURS
        )
      );

      const territoryDetails = await getList("territories", {
        filter: `congregation="${congregationCode}"`,
        requestKey: `territories-${congregationCode}`,
        sort: "code",
        fields: PB_FIELDS.TERRITORIES
      });
      const territoryMap = processCongregationTerritories(territoryDetails);
      setTerritories(territoryMap);

      if (territoryCodeCache && territoryMap.has(territoryCodeCache)) {
        setSelectedTerritoryId(territoryCodeCache);
      } else {
        setTerritoryCodeCache("");
      }

      setIsLoading(false);
    },
    []
  );

  const processMapRecord = useCallback((mapRecord: RecordModel) => {
    return {
      id: mapRecord.id,
      type: mapRecord.type || TERRITORY_TYPES.MULTIPLE_STORIES,
      location: mapRecord.location || "",
      aggregates: {
        display: mapRecord.progress + "%",
        value: mapRecord.progress,
        notDone: mapRecord.aggregates?.notDone || 0,
        notHome: mapRecord.aggregates?.notHome || 0
      },
      mapId: mapRecord.code,
      name: mapRecord.description,
      coordinates: mapRecord.coordinates || DEFAULT_COORDINATES.Singapore
    } as addressDetails;
  }, []);

  const setupAddresses = useCallback(async (territoryId: string) => {
    if (!territoryId) return;
    const maps = await getList("maps", {
      filter: `territory="${territoryId}"`,
      requestKey: `territory-maps-${territoryId}`,
      sort: "code",
      fields: PB_FIELDS.MAPS
    });
    const sortedMaps = maps.map((map) => processMapRecord(map));
    setSortedAddressList(sortedMaps);
    setAccordionKeys(sortedMaps.map((address) => address.id));
    setMapViews(new Map(sortedMaps.map((address) => [address.id, false])));
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
    if (!selectedTerritoryId) return;
    setupAddresses(selectedTerritoryId);
    const selectedTerritoryData = territories.get(selectedTerritoryId);
    setSelectedTerritoryName(selectedTerritoryData?.name);
    setSelectedTerritoryCode(selectedTerritoryData?.code);
    setupRealtimeListener(
      "maps",
      (data) => {
        const mapId = data.record.id;
        const dataAction = data.action;
        setSortedAddressList((prevList) => {
          let updatedList = [] as addressDetails[];
          if (dataAction === "update") {
            updatedList = prevList.map((map) => {
              if (map.id === mapId) {
                return processMapRecord(data.record);
              }
              return map;
            });
          } else if (dataAction === "create") {
            updatedList = [
              ...prevList,
              processMapRecord(data.record)
            ] as addressDetails[];
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
        filter: `territory="${selectedTerritoryId}"`,
        requestKey: null,
        fields: PB_FIELDS.MAPS
      }
    );
    return () => {
      unsubscriber(["addresses", "maps", "assignments", "messages"]);
      setSortedAddressList([]);
    };
  }, [selectedTerritoryId]);

  useVisibilityChange(() => setupAddresses(selectedTerritoryId));

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
        selectedTerritory={selectedTerritoryCode}
        hideFunction={toggleTerritoryListing}
        handleSelect={handleTerritorySelect}
      />
      <TerritoryListing
        showListing={showChangeAddressTerritory}
        territories={congregationTerritoryList}
        selectedTerritory={selectedTerritoryCode}
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
        handleSelect={handleCongregationSelect}
      />
      <Navbar bg="light" variant="light" expand="lg">
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
              <Button
                className="m-1"
                size="sm"
                variant="outline-primary"
                onClick={toggleCongregationListing}
              >
                Select Congregation
              </Button>
            )}
            {congregationTerritoryList &&
              congregationTerritoryList.length > 0 && (
                <Button
                  className="m-1"
                  size="sm"
                  variant="outline-primary"
                  onClick={toggleTerritoryListing}
                >
                  {selectedTerritoryCode ? (
                    <>
                      <AggregationBadge
                        aggregate={
                          territories.get(selectedTerritoryId as string)
                            ?.aggregates || 0
                        }
                      />
                      {selectedTerritoryCode}
                    </>
                  ) : (
                    "Select Territory"
                  )}
                </Button>
              )}
            {!selectedTerritoryCode && policy.hasOptions() && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={userAccessLevel}
              >
                <Button
                  className="m-1"
                  size="sm"
                  variant="outline-primary"
                  onClick={() =>
                    ModalManager.show(SuspenseComponent(NewTerritoryCode), {
                      footerSaveAcl: userAccessLevel,
                      congregation: congregationCode
                    })
                  }
                >
                  Create Territory
                </Button>
              </ComponentAuthorizer>
            )}
            {selectedTerritoryCode && policy.hasOptions() && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={userAccessLevel}
              >
                <DropdownButton
                  className="dropdown-btn"
                  variant="outline-primary"
                  size="sm"
                  title={
                    isProcessingTerritory ? (
                      <>
                        <Spinner size="sm" /> Territory
                      </>
                    ) : (
                      "Territory"
                    )
                  }
                >
                  <Dropdown.Item
                    onClick={() =>
                      ModalManager.show(SuspenseComponent(NewTerritoryCode), {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode
                      })
                    }
                  >
                    Create New
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() =>
                      ModalManager.show(
                        SuspenseComponent(ChangeTerritoryCode),
                        {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationCode,
                          territoryCode: selectedTerritoryCode,
                          territoryId: selectedTerritoryId
                        }
                      ).then((updatedCode) => {
                        setSelectedTerritoryCode(updatedCode as string);
                        setTerritories(
                          new Map<string, territoryDetails>(
                            Array.from(territories).map(([key, value]) => {
                              if (key === selectedTerritoryId) {
                                value.code = updatedCode as string;
                              }
                              return [key, value];
                            })
                          )
                        );
                      })
                    }
                  >
                    Change Code
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() =>
                      ModalManager.show(
                        SuspenseComponent(ChangeTerritoryName),
                        {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationCode,
                          territoryCode: selectedTerritoryId,
                          name: selectedTerritoryName
                        }
                      ).then((updatedName) => {
                        setSelectedTerritoryName(updatedName as string);
                        setTerritories(
                          new Map<string, territoryDetails>(
                            Array.from(territories).map(([key, value]) => {
                              if (key === selectedTerritoryId) {
                                value.name = updatedName as string;
                              }
                              return [key, value];
                            })
                          )
                        );
                      })
                    }
                  >
                    Change Name
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        `⚠️ WARNING: Deleting territory "${selectedTerritoryCode}" will remove all associated maps and assignments. This action cannot be undone. Proceed?`
                      );

                      if (confirmDelete) {
                        deleteTerritory();
                      }
                    }}
                  >
                    Delete Current
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      const confirmReset = window.confirm(
                        `⚠️ WARNING: Resetting territory "${selectedTerritoryCode}" will reset the status of all addresses. This action cannot be undone. Proceed?`
                      );

                      if (confirmReset) {
                        resetTerritory();
                      }
                    }}
                  >
                    Reset status
                  </Dropdown.Item>
                </DropdownButton>
              </ComponentAuthorizer>
            )}
            {selectedTerritoryCode && policy.hasOptions() && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={userAccessLevel}
              >
                <DropdownButton
                  className="dropdown-btn"
                  variant="outline-primary"
                  size="sm"
                  title="New Map"
                  align="end"
                >
                  <Dropdown.Item
                    onClick={() =>
                      ModalManager.show(SuspenseComponent(NewSingleMap), {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode,
                        territoryCode: selectedTerritoryId,
                        defaultType: policy.defaultType,
                        origin: policy.origin
                      })
                    }
                  >
                    Multi-story
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() =>
                      ModalManager.show(SuspenseComponent(NewMultiMap), {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationCode,
                        territoryCode: selectedTerritoryId,
                        defaultType: policy.defaultType,
                        origin: policy.origin
                      })
                    }
                  >
                    Single-Story
                  </Dropdown.Item>
                </DropdownButton>
              </ComponentAuthorizer>
            )}
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={userAccessLevel}
            >
              <DropdownButton
                className="dropdown-btn"
                size="sm"
                variant="outline-primary"
                title={
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
                    Congregation
                  </>
                }
                align={{ lg: "end" }}
              >
                <Dropdown.Item
                  onClick={() =>
                    ModalManager.show(
                      SuspenseComponent(UpdateCongregationSettings),
                      {
                        currentName: congregationName,
                        currentCongregation: congregationCode,
                        currentMaxTries:
                          policy?.maxTries || DEFAULT_CONGREGATION_MAX_TRIES,
                        currentDefaultExpiryHrs: defaultExpiryHours
                      }
                    )
                  }
                >
                  Settings
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    ModalManager.show(
                      SuspenseComponent(UpdateCongregationOptions),
                      {
                        currentCongregation: congregationCode
                      }
                    )
                  }
                >
                  Household Options
                </Dropdown.Item>
                <Dropdown.Item onClick={async () => await getUsers()}>
                  Manage Users
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    ModalManager.show(SuspenseComponent(InviteUser), {
                      email: getUser("email") as string,
                      congregation: congregationCode,
                      footerSaveAcl: userAccessLevel
                    });
                  }}
                >
                  Invite User
                </Dropdown.Item>
              </DropdownButton>
            </ComponentAuthorizer>
            <DropdownButton
              className="dropdown-btn"
              size="sm"
              variant="outline-primary"
              title={
                <>
                  {isAssignmentLoading && (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        aria-hidden="true"
                      />{" "}
                    </>
                  )}{" "}
                  Account
                </>
              }
              align={{ lg: "end" }}
            >
              <Dropdown.Item
                onClick={() => {
                  ModalManager.show(SuspenseComponent(GetProfile), {
                    user: getUser() as AuthRecord
                  });
                }}
              >
                Profile
              </Dropdown.Item>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                userPermission={userAccessLevel}
              >
                <Dropdown.Item
                  onClick={() =>
                    getAssignments(congregationCode, getUser("id") as string)
                  }
                >
                  Assignments
                </Dropdown.Item>
              </ComponentAuthorizer>
              <Dropdown.Item
                onClick={async () => {
                  await requestPasswordReset();
                  alert("Password reset email sent.");
                }}
              >
                Change Password
              </Dropdown.Item>
              <Dropdown.Item onClick={logoutUser}>Logout</Dropdown.Item>
            </DropdownButton>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {!selectedTerritoryCode && <Welcome name={userName} />}
      <TerritoryHeader name={selectedTerritoryName} />
      {isMapView ? (
        <MapView
          key={`mapview-${selectedTerritoryId}`}
          sortedAddressList={sortedAddressList}
          policy={policy}
        />
      ) : (
        <MapListing
          key={`maplist-${selectedTerritoryId}`}
          sortedAddressList={sortedAddressList}
          accordingKeys={accordingKeys}
          setAccordionKeys={setAccordionKeys}
          mapViews={mapViews}
          setMapViews={setMapViews}
          policy={policy}
          values={values}
          setValues={setValues}
          userAccessLevel={userAccessLevel || USER_ACCESS_LEVELS.NO_ACCESS.CODE}
          isReadonly={isReadonly}
          deleteMap={deleteMap}
          addFloorToMap={addFloorToMap}
          resetMap={resetMap}
          processingMap={processingMap}
          toggleAddressTerritoryListing={toggleAddressTerritoryListing}
        />
      )}
      {selectedTerritoryCode && (
        <>
          <ModeToggle
            onClick={() => {
              setIsMapView(!isMapView);
            }}
            isMapView={isMapView}
          />
          <BackToTopButton showButton={showBkTopButton} />
        </>
      )}
    </>
  );
}

export default Admin;
