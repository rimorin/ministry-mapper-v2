import "../css/admin.css";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  lazy,
  useRef,
  MouseEvent
} from "react";
import {
  Accordion,
  Button,
  Container,
  Dropdown,
  DropdownButton,
  Navbar,
  ProgressBar,
  Spinner
} from "react-bootstrap";
import { useRollbar } from "@rollbar/react";
import { RecordModel } from "pocketbase";

import {
  valuesDetails,
  territoryDetails,
  addressDetails,
  adminProps,
  userDetails,
  CongregationAccessObject,
  DropDirections,
  DropDirection
} from "../utils/interface";
import { LinkSession, Policy } from "../utils/policies";
import {
  DEFAULT_SELF_DESTRUCT_HOURS,
  USER_ACCESS_LEVELS,
  PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY,
  TERRITORY_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
  DEFAULT_AGGREGATES,
  DEFAULT_COORDINATES,
  PB_FIELDS
} from "../utils/constants";
import errorHandler from "../utils/helpers/errorhandler";

import MainTable from "../components/table/map";
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
import AssignmentButtonGroup from "../components/navigation/assignmentbtn";
import MessageButtonGroup from "../components/navigation/messagebtn";
import getDataById from "../utils/helpers/getdatabyid";
import { pb } from "../utils/pocketbase";

const GetMapGeolocation = lazy(() => import("../components/modal/getlocation"));

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
const NewUnit = lazy(() => import("../components/modal/newunit"));
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
const ChangeMapCode = lazy(() => import("../components/modal/changemapcd"));
const ChangeMapGeoLocation = lazy(
  () => import("../components/modal/changegeolocation")
);
const ChangeAddressName = lazy(
  () => import("../components/modal/changeaddname")
);

function Admin({ user }: adminProps) {
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
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>();
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
  const [dropDirections, setDropDirections] = useState<DropDirections>({});
  const rollbar = useRollbar();
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

  const handleDropdownDirection = (
    event: MouseEvent<HTMLElement, globalThis.MouseEvent>,
    dropdownId: string
  ) => {
    const clickPositionY = event.clientY;
    const dropdownHeight = 300;
    const windowInnerHeight = window.innerHeight;

    let dropdownDirection: DropDirection = "down";
    if (windowInnerHeight - clickPositionY < dropdownHeight) {
      dropdownDirection = "up";
    }
    setDropDirections((prev) => ({ ...prev, [dropdownId]: dropdownDirection }));
  };

  const getUsers = useCallback(async () => {
    try {
      setIsShowingUserListing(true);
      setCongregationUsers(await getCongregationUsers(congregationCode));
      toggleUserListing();
    } catch (error) {
      errorHandler(error, rollbar);
    } finally {
      setIsShowingUserListing(false);
    }
  }, [congregationCode]);

  const logoutUser = useCallback(async () => {
    pb.authStore.clear();
  }, []);

  const deleteTerritory = useCallback(async () => {
    if (!selectedTerritoryId) return;
    setIsProcessingTerritory(true);
    try {
      // kill all subscriptions before deleting
      await pb.collection("maps").unsubscribe();
      await pb.collection("addresses").unsubscribe();
      await pb.collection("messages").unsubscribe();
      await pb.collection("territories").delete(selectedTerritoryId, {
        requestKey: `territory-del-${congregationCode}-${selectedTerritoryCode}`
      });
      alert(`Deleted territory, ${selectedTerritoryCode}.`);
      window.location.reload();
    } catch (error) {
      errorHandler(error, rollbar);
    } finally {
      setIsProcessingTerritory(false);
    }
  }, [selectedTerritoryCode, congregationCode]);

  const deleteMap = useCallback(
    async (mapId: string, name: string, showAlert: boolean) => {
      setProcessingMap({ isProcessing: true, mapId: mapId });
      try {
        await pb.collection("maps").delete(mapId, {
          requestKey: `map-del-${mapId}`
        });
        if (showAlert) alert(`Deleted address, ${name}.`);
      } catch (error) {
        errorHandler(error, rollbar);
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
        await pb.send("map/floor/add", {
          method: "POST",
          body: {
            map: mapId,
            add_higher: higherFloor
          }
        });
      } catch (error) {
        errorHandler(error, rollbar);
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
      await pb.send("territory/reset", {
        method: "POST",
        body: {
          territory: selectedTerritoryId
        }
      });
    } catch (error) {
      errorHandler(error, rollbar);
    } finally {
      setIsProcessingTerritory(false);
    }
  }, [selectedTerritoryCode, selectedTerritoryId]);

  const resetMap = useCallback(async (mapId: string) => {
    setProcessingMap({ isProcessing: true, mapId: mapId });
    try {
      await pb.send("map/reset", {
        method: "POST",
        body: {
          map: mapId
        }
      });
    } catch (error) {
      errorHandler(error, rollbar);
    } finally {
      setProcessingMap({ isProcessing: false, mapId: null });
    }
  }, []);

  const processCongregationTerritories = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    congregationTerritories: any
  ) => {
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
  };

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
        await pb.send("map/territory/update", {
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
        errorHandler(error, rollbar);
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
      const snapshot = await pb.collection("assignments").getFullList({
        filter: `user="${uid}"`,
        sort: "created",
        expand: "map",
        fields: PB_FIELDS.ASSIGNMENTS,
        requestKey: `get-usr-assignments-${uid}`
      });

      if (snapshot.length === 0) {
        alert("No assignments found.");
        return;
      }

      const linkListing = new Array<LinkSession>();
      snapshot.forEach((link) => {
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

  useEffect(() => {
    const fetchData = async () => {
      const userRoles = await pb.collection("roles").getFullList({
        filter: `user="${user?.id}"`,
        expand: "congregation",
        fields: PB_FIELDS.ROLES,
        requestKey: `user-roles-${user?.id}`
      });
      if (!userRoles || userRoles.length === 0) {
        setIsLoading(false);
        setIsUnauthorised(true);
        errorHandler(`Unauthorised access by ${user?.email}`, rollbar, false);
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
    };

    fetchData();

    const handleScroll = () => {
      setShowBkTopButton(window.scrollY > PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!congregationCode) return;
    setUserAccessLevel(congregationAccess.current[congregationCode]);

    const fetchCongregationData = async () => {
      const congDetails = await getDataById("congregations", congregationCode, {
        requestKey: `congregation-${congregationCode}`
      });

      if (!congDetails) {
        alert("Congregation not found.");
        return;
      }

      const congOptions = await pb.collection("options").getFullList({
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
          pb.authStore?.record?.name,
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

      const territoryDetails = await pb.collection("territories").getFullList({
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

      pb.collection("territories").subscribe(
        "*",
        (sub) => {
          const data = sub.record;
          setTerritories((prev) => {
            const updatedTerritories = new Map(prev);
            if (sub.action === "delete") {
              updatedTerritories.delete(data.id);
            } else {
              updatedTerritories.set(data.id, {
                id: data.id,
                code: data.code,
                name: data.description,
                aggregates: data.progress
              });
            }
            return updatedTerritories;
          });
        },
        {
          filter: `congregation="${congregationCode}"`,
          requestKey: `territories-sub-${congregationCode}`,
          fields: PB_FIELDS.TERRITORIES
        }
      );
      setIsLoading(false);
    };
    fetchCongregationData();
    return () => {
      pb.collection("territories").unsubscribe();
    };
  }, [congregationCode]);

  useEffect(() => {
    if (!selectedTerritoryId) return;
    const selectedTerritoryData = territories.get(selectedTerritoryId);
    setSelectedTerritoryName(selectedTerritoryData?.name);
    setSelectedTerritoryCode(selectedTerritoryData?.code);

    const processMapRecord = (mapRecord: RecordModel) => {
      return {
        id: mapRecord.id,
        type: mapRecord.type || TERRITORY_TYPES.MULTIPLE_STORIES,
        location: mapRecord.location || "",
        aggregates: {
          display: mapRecord.progress + "%",
          value: mapRecord.progress
        },
        mapId: mapRecord.code,
        name: mapRecord.description,
        coordinates: mapRecord.coordinates || DEFAULT_COORDINATES.Singapore
      } as addressDetails;
    };

    const fetchMapData = async () => {
      const maps = await pb.collection("maps").getFullList({
        filter: `territory="${selectedTerritoryId}"`,
        requestKey: `territory-maps-${selectedTerritoryId}`,
        sort: "code",
        fields: PB_FIELDS.MAPS
      });
      return maps.map((map) => processMapRecord(map));
    };

    const setupAddresses = async () => {
      const sortedMaps = await fetchMapData();
      setSortedAddressList(sortedMaps);
      setAccordionKeys(sortedMaps.map((address) => address.id));
      setMapViews(new Map(sortedMaps.map((address) => [address.id, false])));
    };

    pb.collection("maps").subscribe(
      "*",
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
        requestKey: `maps-sub-${selectedTerritoryId}`,
        fields: PB_FIELDS.MAPS
      }
    );

    setupAddresses();

    return () => {
      pb.collection("maps").unsubscribe();
      pb.collection("addresses").unsubscribe();
      pb.collection("messages").unsubscribe();
      pb.collection("assignments").unsubscribe();
      setSortedAddressList([]);
    };
  }, [selectedTerritoryId]);

  if (isLoading) return <Loader />;
  if (isUnauthorised) {
    return <UnauthorizedPage handleClick={logoutUser} name={`${user?.name}`} />;
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
        currentUid={user?.id}
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
                      email: pb.authStore?.record?.id,
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
                    user: pb.authStore.record
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
                    getAssignments(
                      congregationCode,
                      pb.authStore.record?.id as string
                    )
                  }
                >
                  Assignments
                </Dropdown.Item>
              </ComponentAuthorizer>
              <Dropdown.Item
                onClick={async () => {
                  await pb
                    .collection("users")
                    .requestPasswordReset(pb.authStore?.record?.email, {
                      requestKey: `reset-password-${pb.authStore?.record?.email}`
                    });
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
      {!selectedTerritoryCode && <Welcome name={`${user?.name}`} />}
      <TerritoryHeader name={selectedTerritoryName} />
      <Accordion
        activeKey={isReadonly ? undefined : accordingKeys}
        onSelect={(eventKeys) => {
          if (Array.isArray(eventKeys)) {
            setAccordionKeys(
              eventKeys.map((key) => {
                return key.toString();
              })
            );
          }
        }}
        alwaysOpen={!isReadonly}
        flush
      >
        {sortedAddressList.map((addressElement) => {
          const currentMapId = addressElement.id;
          const currentMapCode = addressElement.mapId;
          const currentMapName = addressElement.name;
          const currentMapType = addressElement.type;
          const completeValue =
            addressElement.aggregates?.value || DEFAULT_AGGREGATES.value;
          const completedPercent =
            addressElement.aggregates?.display || DEFAULT_AGGREGATES.display;
          return (
            <Accordion.Item
              key={`accordion-${currentMapId}`}
              eventKey={currentMapId}
            >
              <Accordion.Header>
                <span className="fluid-bolding fluid-text">
                  {currentMapName}
                </span>
              </Accordion.Header>
              <Accordion.Body className="p-0">
                <ProgressBar
                  style={{ borderRadius: 0 }}
                  now={completeValue}
                  label={completedPercent}
                />
                <div key={`div-${currentMapId}`}>
                  <Navbar bg="light" expand="lg" key={`navbar-${currentMapId}`}>
                    <Container fluid className="justify-content-end">
                      {/* if type is single, display a button to indicate list or map view. Set MapView ref with boolean */}
                      {currentMapType === TERRITORY_TYPES.SINGLE_STORY && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="m-1"
                          onClick={() => {
                            setMapViews((prev) => {
                              const updatedMapViews = new Map(prev);
                              updatedMapViews.set(
                                currentMapId,
                                !updatedMapViews.get(currentMapId)
                              );
                              return updatedMapViews;
                            });
                          }}
                        >
                          {mapViews.get(currentMapId)
                            ? "List View"
                            : "Map View"}
                        </Button>
                      )}

                      <AssignmentButtonGroup
                        addressElement={addressElement}
                        policy={policy}
                        userId={pb.authStore?.record?.id as string}
                      />
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="m-1"
                        onClick={() => {
                          ModalManager.show(
                            SuspenseComponent(GetMapGeolocation),
                            {
                              coordinates: addressElement.coordinates,
                              name: currentMapName,
                              origin: policy.origin
                            }
                          );
                        }}
                      >
                        Direction
                      </Button>
                      <MessageButtonGroup
                        addressElement={addressElement}
                        policy={policy}
                      />
                      <ComponentAuthorizer
                        requiredPermission={
                          USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                        }
                        userPermission={userAccessLevel}
                      >
                        <DropdownButton
                          className="dropdown-btn"
                          align="end"
                          variant="outline-primary"
                          size="sm"
                          title={
                            <>
                              {processingMap.isProcessing &&
                                processingMap.mapId === currentMapId && (
                                  <>
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      aria-hidden="true"
                                    />{" "}
                                  </>
                                )}{" "}
                              Address
                            </>
                          }
                          drop={dropDirections[currentMapId]}
                          onClick={(e) =>
                            handleDropdownDirection(e, currentMapId)
                          }
                        >
                          <Dropdown.Item
                            onClick={() =>
                              ModalManager.show(
                                SuspenseComponent(ChangeMapGeoLocation),
                                {
                                  footerSaveAcl: userAccessLevel,
                                  mapId: currentMapId,
                                  coordinates: addressElement.coordinates,
                                  origin: policy.origin
                                }
                              )
                            }
                          >
                            Change Location
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              ModalManager.show(
                                SuspenseComponent(ChangeMapCode),
                                {
                                  footerSaveAcl: userAccessLevel,
                                  mapId: currentMapId,
                                  mapCode: currentMapCode
                                }
                              )
                            }
                          >
                            Change Map Number
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => {
                              setValues({
                                ...values,
                                map: currentMapId,
                                name: currentMapName
                              });
                              toggleAddressTerritoryListing();
                            }}
                          >
                            Change Territory
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              ModalManager.show(
                                SuspenseComponent(ChangeAddressName),
                                {
                                  footerSaveAcl: userAccessLevel,
                                  mapId: currentMapId,
                                  name: currentMapName
                                }
                              )
                            }
                          >
                            Rename
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => {
                              ModalManager.show(SuspenseComponent(NewUnit), {
                                footerSaveAcl: userAccessLevel,
                                mapId: currentMapId,
                                addressData: addressElement
                              });
                            }}
                          >
                            Add{" "}
                            {addressElement.type ===
                            TERRITORY_TYPES.SINGLE_STORY
                              ? "Property"
                              : "Unit"}{" "}
                            No.
                          </Dropdown.Item>
                          {(!addressElement.type ||
                            addressElement.type ===
                              TERRITORY_TYPES.MULTIPLE_STORIES) && (
                            <Dropdown.Item
                              onClick={() => {
                                addFloorToMap(currentMapId, true);
                              }}
                            >
                              Add Higher Floor
                            </Dropdown.Item>
                          )}
                          {(!addressElement.type ||
                            addressElement.type ===
                              TERRITORY_TYPES.MULTIPLE_STORIES) && (
                            <Dropdown.Item
                              onClick={() => {
                                addFloorToMap(currentMapId);
                              }}
                            >
                              Add Lower Floor
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item
                            onClick={() => {
                              const confirmReset = window.confirm(
                                `⚠️ WARNING: Resetting all property statuses of "${currentMapName}" will reset all statuses. This action cannot be undone. Proceed?`
                              );

                              if (confirmReset) {
                                resetMap(currentMapId);
                              }
                            }}
                          >
                            Reset Status
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => {
                              const confirmDelete = window.confirm(
                                `⚠️ WARNING: Deleting map "${currentMapName}" will remove it completely. This action cannot be undone. Proceed?`
                              );

                              if (confirmDelete) {
                                deleteMap(currentMapId, currentMapName, true);
                              }
                            }}
                          >
                            Delete
                          </Dropdown.Item>
                        </DropdownButton>
                      </ComponentAuthorizer>
                    </Container>
                  </Navbar>
                  <MainTable
                    mapView={mapViews.get(currentMapId)}
                    key={`table-${currentMapId}`}
                    policy={policy}
                    addressDetails={addressElement}
                  />
                </div>
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>
      <BackToTopButton showButton={showBkTopButton} />
    </>
  );
}

export default Admin;
