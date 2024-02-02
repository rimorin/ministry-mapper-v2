import "../../css/admin.css";
import { signOut } from "firebase/auth";
import { nanoid } from "nanoid";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  lazy,
  useRef,
  useContext
} from "react";
import { auth, functions, firestore } from "../../firebase";
import {
  query,
  collection,
  getDocs,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  Unsubscribe,
  DocumentData
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  valuesDetails,
  floorDetails,
  territoryDetails,
  addressDetails,
  adminProps,
  userDetails,
  OptionProps,
  unitDetails,
  CongregationProps,
  AlertSnackbarProps
} from "../../utils/interface";
import "react-confirm-alert/src/react-confirm-alert.css";
import InstructionsButton from "../../components/form/instructions";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { useRollbar } from "@rollbar/react";
import { LinkSession, Policy } from "../../utils/policies";
import AdminTable from "../../components/table/admin";
import errorHandler from "../../utils/helpers/errorhandler";
import ZeroPad from "../../utils/helpers/zeropad";
import addHours from "../../utils/helpers/addhours";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import getMaxUnitLength from "../../utils/helpers/maxunitlength";
import processCompletedPercentage from "../../utils/helpers/processcompletedpercent";
import NavBarBranding from "../../components/navigation/branding";
// import AggregationBadge from "../../components/navigation/aggrbadge";
import ComponentAuthorizer from "../../components/navigation/authorizer";
import BackToTopButton from "../../components/navigation/backtotop";
import HelpButton from "../../components/navigation/help";
import Loader from "../../components/statics/loader";
import deleteBlockFloor from "../../utils/helpers/deletefloors";
import deleteTerritoryAddress from "../../utils/helpers/deleteaddress";
import getLinks from "../../utils/helpers/getlinks";
import ResetAddresses from "../../utils/helpers/resetaddress";
import deleteTerritory from "../../utils/helpers/deleteterritory";
import adjustAddressFloor from "../../utils/helpers/adjustaddressfloor";
import buildLink from "../../utils/helpers/buildlink";
import {
  DEFAULT_FLOOR_PADDING,
  DEFAULT_SELF_DESTRUCT_HOURS,
  LINK_TYPES,
  UNSUPPORTED_BROWSER_MSG,
  USER_ACCESS_LEVELS,
  TERRITORY_VIEW_WINDOW_WELCOME_TEXT,
  PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY,
  TERRITORY_TYPES,
  WIKI_CATEGORIES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  LISTENER_TYPES
} from "../../utils/constants";
import ModalManager from "@ebay/nice-modal-react";
import GetDirection from "../../utils/helpers/directiongenerator";
import getOptions from "../../utils/helpers/getcongoptions";
import SuspenseComponent from "../../components/utils/suspense";
import Header from "../../components/header";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dropdown,
  GlobalStyles,
  IconButton,
  List,
  ListDivider,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  ListSubheader,
  Menu,
  MenuButton,
  MenuItem,
  Sheet,
  Stack,
  Typography,
  listItemButtonClasses
} from "@mui/joy";
import { Add, DeleteForever, Edit, Login, MoreVert } from "@mui/icons-material";
import ColorSchemeToggle from "../../components/ColorSchemeToggle";
import { closeSidebar, toggleSidebar } from "../../components/utils/sidebar";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import SupportRoundedIcon from "@mui/icons-material/SupportRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import MapIcon from "@mui/icons-material/Map";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Toggler from "../../components/Sidebar";
import MenuIcon from "@mui/icons-material/Menu";
import ShareIcon from "@mui/icons-material/Share";
import { AlertContext } from "../../components/utils/context";
import { Modal } from "react-bootstrap";
const UnauthorizedPage = lazy(() => import("../../components/statics/unauth"));
const UpdateUser = lazy(() => import("../../components/modal/updateuser"));
const UpdateUnitStatus = SuspenseComponent(
  lazy(() => import("../../components/modal/updatestatus"))
);
const UpdateUnit = lazy(() => import("../../components/modal/updateunit"));
const ConfirmSlipDetails = SuspenseComponent(
  lazy(() => import("../../components/modal/slipdetails"))
);
const UpdateCongregationSettings = lazy(
  () => import("../../components/modal/congsettings")
);
const UpdateCongregationOptions = lazy(
  () => import("../../components/modal/congoptions")
);
const UpdateAddressInstructions = lazy(
  () => import("../../components/modal/instructions")
);
const UpdateAddressFeedback = lazy(
  () => import("../../components/modal/updateaddfeedback")
);
const NewUnit = SuspenseComponent(
  lazy(() => import("../../components/modal/newunit"))
);
const NewTerritoryCode = SuspenseComponent(
  lazy(() => import("../../components/modal/newterritorycd"))
);
const NewPublicAddress = SuspenseComponent(
  lazy(() => import("../../components/modal/newpublicadd"))
);
const NewPrivateAddress = SuspenseComponent(
  lazy(() => import("../../components/modal/newprivateadd"))
);
const InviteUser = lazy(() => import("../../components/modal/inviteuser"));
const GetProfile = SuspenseComponent(
  lazy(() => import("../../components/modal/profile"))
);
const GetAssignments = lazy(() => import("../../components/modal/assignments"));
const ChangeTerritoryName = SuspenseComponent(
  lazy(() => import("../../components/modal/changeterritoryname"))
);
const ChangeTerritoryCode = SuspenseComponent(
  lazy(() => import("../../components/modal/changeterritorycd"))
);
const ChangePassword = SuspenseComponent(
  lazy(() => import("../../components/modal/changepassword"))
);
const ChangeAddressPostalCode = SuspenseComponent(
  lazy(() => import("../../components/modal/changepostalcd"))
);
const ChangeAddressName = SuspenseComponent(
  lazy(() => import("../../components/modal/changeaddname"))
);

const ConfirmationDialog = SuspenseComponent(
  lazy(() => import("../../components/modal/confirmation"))
);
function Admin({ user }: adminProps) {
  const [isSettingPersonalLink, setIsSettingPersonalLink] =
    useState<boolean>(false);
  const [isSettingAssignLink, setIsSettingAssignLink] =
    useState<boolean>(false);
  const [selectedPostal, setSelectedPostal] = useState<string>();
  const [isSettingViewLink, setIsSettingViewLink] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorised, setIsUnauthorised] = useState<boolean>(false);
  const [showBkTopButton, setShowBkTopButton] = useState(false);
  const [showTerritoryListing, setShowTerritoryListing] =
    useState<boolean>(false);
  const [showUserListing, setShowUserListing] = useState<boolean>(false);
  const [isShowingUserListing, setIsShowingUserListing] =
    useState<boolean>(false);
  const [congUsers, setCongUsers] = useState(new Map<string, userDetails>());
  const [showChangeAddressTerritory, setShowChangeAddressTerritory] =
    useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [values, setValues] = useState<object>({});
  const [territories, setTerritories] = useState(
    new Map<string, territoryDetails>()
  );
  const [assignmentLinks, setAssignmentLinksData] = useState(
    new Map<string, LinkSession[]>()
  );
  const [personalLinks, setPersonalLinksData] = useState(
    new Map<string, LinkSession[]>()
  );
  const [selectedTerritoryCode, setSelectedTerritoryCode] = useState<string>();
  const [selectedTerritoryName, setSelectedTerritoryName] = useState<string>();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>();
  const [addressData, setAddressData] = useState(
    new Map<string, addressDetails>()
  );
  const [mapDisplay, setMapDisplay] = useState(new Map<string, boolean>());
  const [userAccessLevel, setUserAccessLevel] = useState<number>();
  const [defaultExpiryHours, setDefaultExpiryHours] = useState<number>(
    DEFAULT_SELF_DESTRUCT_HOURS
  );
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [options, setOptions] = useState<Array<OptionProps>>([]);
  const [congregationId, setCongregationId] = useState<string>("");
  const [congregations, setCongregations] = useState<Array<CongregationProps>>(
    []
  );
  const [isAssignmentLoading, setIsAssignmentLoading] =
    useState<boolean>(false);
  const rollbar = useRollbar();
  const { setSnackbarAlert } = useContext(AlertContext) as AlertSnackbarProps;
  const listeners = useRef<{ [key: string]: Unsubscribe[] }>({
    [LISTENER_TYPES.MAP]: [],
    [LISTENER_TYPES.ADDRESS]: [],
    [LISTENER_TYPES.LINK]: [],
    [LISTENER_TYPES.TERRITORY]: []
  });

  const ClearRealtimeListeners = (
    listenerTypes: string[] = Object.keys(LISTENER_TYPES)
  ) => {
    listenerTypes.forEach((listenerType) => {
      if (listeners.current[listenerType]) {
        console.log(`Clearing ${listenerType} listeners`);
        listeners.current[listenerType].forEach((listener) => listener());
        listeners.current[listenerType] = [];
      }
    });
  };

  const getUsers = async () => {
    const getCongregationUsers = httpsCallable(
      functions,
      "getCongregationUsers"
    );
    try {
      setIsShowingUserListing(true);
      const result = (await getCongregationUsers({
        congregation: congregationId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;
      if (Object.keys(result.data).length === 0) {
        alert("There are no users to manage.");
        return;
      }
      const userListing = new Map<string, userDetails>();
      for (const key in result.data) {
        const data = result.data[key];
        userListing.set(key, {
          uid: key,
          name: data.name,
          verified: data.verified,
          email: data.email,
          role: data.role
        });
      }
      setCongUsers(userListing);
      toggleUserListing();
    } catch (error) {
      errorHandler(error, rollbar);
    } finally {
      setIsShowingUserListing(false);
    }
  };

  const refreshState = (
    listenerTypes: string[] = Object.values(LISTENER_TYPES)
  ) => {
    ClearRealtimeListeners(listenerTypes);
    if (listenerTypes.includes(LISTENER_TYPES.MAP)) {
      setAddressData(new Map<string, addressDetails>());

      setMapDisplay(new Map<string, boolean>());
      setSelectedTerritoryName("");
      setSelectedTerritoryCode("");
      setSelectedTerritoryId("");
    }
    if (listenerTypes.includes(LISTENER_TYPES.LINK)) {
      setAssignmentLinksData(new Map<string, LinkSession[]>());
      setPersonalLinksData(new Map<string, LinkSession[]>());
    }
    if (listenerTypes.includes(LISTENER_TYPES.TERRITORY)) {
      setTerritories(new Map<string, territoryDetails>());
    }
    if (listenerTypes.includes(LISTENER_TYPES.CONGREGATION)) {
      setCongUsers(new Map<string, userDetails>());
      setPolicy(new Policy());
      setOptions([]);
      setCongregations([]);
    }
  };

  const logoutUser = async () => {
    refreshState();
    await signOut(auth);
  };

  const processTerritory = async (selectedTerritory: string) => {
    refreshState([LISTENER_TYPES.MAP, LISTENER_TYPES.ADDRESS]);
    console.log(
      `selectedTerritory: ${selectedTerritory}, ${congregationId}, ${selectedTerritoryId}`
    );
    const territoryData = await getDoc(
      doc(
        firestore,
        `congregations/${congregationId}/territories/${selectedTerritory}`
      )
    );

    const territoryName = territoryData.data()?.name;
    const territoryCode = territoryData.data()?.code;

    setSelectedTerritoryName(territoryName);
    setSelectedTerritoryCode(territoryCode);
    setSelectedTerritoryId(selectedTerritory);

    listeners.current[LISTENER_TYPES.MAP].push(
      onSnapshot(
        query(
          collection(firestore, `congregations/${congregationId}/maps`),
          where("territory", "==", selectedTerritory),
          orderBy("progress.aggregate", "asc")
        ),
        (snapshot) => {
          const territoryAddresses = new Map<string, addressDetails>();
          snapshot.forEach((map) => {
            const mapData = map.data();
            const mapid = map.id;
            const postalCode = mapData.postal_code;
            const mapname = mapData.name;

            const addressData = {
              mapId: mapid,
              territoryId: selectedTerritory,
              name: mapname,
              postalCode: postalCode,
              floors: [] as Array<floorDetails>,
              feedback: mapData.feedback,
              type: mapData.type,
              instructions: mapData.instructions,
              aggregate: mapData.progress?.aggregate || 0,
              done: mapData.progress?.done || 0,
              notdone: mapData.progress?.not_done || 0,
              nothome: mapData.progress?.not_home || 0
            };
            territoryAddresses.set(mapid, addressData);
          });
          setAddressData((existingAddresses) => {
            const newAddresses = new Map(existingAddresses);
            territoryAddresses.forEach((addressData, mapId) => {
              const existingAddressData = newAddresses.get(mapId);
              if (existingAddressData) {
                addressData.floors = existingAddressData.floors;
              }
              newAddresses.set(mapId, addressData);
            });
            return newAddresses;
          });
        }
      )
    );

    listeners.current[LISTENER_TYPES.LINK].push(
      onSnapshot(
        query(
          collection(firestore, "links"),
          where("territory", "==", selectedTerritory),
          where("type", "in", [LINK_TYPES.ASSIGNMENT, LINK_TYPES.PERSONAL])
        ),
        (snapshot) => {
          const assignmentLinksData = new Map<string, LinkSession[]>();
          const personalLinksData = new Map<string, LinkSession[]>();
          snapshot.forEach((doc) => {
            const linkData = doc.data();
            const linkId = doc.id;
            const linkType = linkData.type;
            const linkExpiry = linkData.endDate;
            const linkMap = linkData.map;
            const linkName = linkData.name;
            const linkAssignee = linkData.user;
            const linkMaxTries = linkData.maxTries;

            const link = new LinkSession(
              {
                user: linkAssignee,
                createDate: linkData.createDate,
                endDate: linkExpiry,
                congregation: congregationId,
                name: linkName,
                publisherName: linkData.publisherName,
                type: linkType,
                maxTries: linkMaxTries,
                map: linkMap,
                territory: selectedTerritory
              },
              linkId
            );
            if (linkType === LINK_TYPES.ASSIGNMENT) {
              const assignmentLinks = assignmentLinksData.get(linkMap) || [];
              assignmentLinks.push(link);
              assignmentLinksData.set(linkMap, assignmentLinks);
            } else if (linkType === LINK_TYPES.PERSONAL) {
              const personalLinks = personalLinksData.get(linkMap) || [];
              personalLinks.push(link);
              personalLinksData.set(linkMap, personalLinks);
            }
          });
          setAssignmentLinksData(assignmentLinksData);
          setPersonalLinksData(personalLinksData);
        }
      )
    );
  };

  const createUnitData = (id: string, addressData: DocumentData) => ({
    addressId: id,
    number: addressData.number,
    status: addressData.status,
    type: addressData.type,
    note: addressData.note,
    nhcount: addressData.nh_count,
    sequence: addressData.sequence,
    dnctime: addressData.dnc_time,
    propertyPostal: addressData.postal_code
  });

  const configureMapListener = useCallback(
    (mapId: string, territoryId: string, congId: string) => {
      let listenerExists = false;
      setMapDisplay((existingMapDisplay) => {
        const newMapDisplay = new Map(existingMapDisplay);
        if (newMapDisplay.has(mapId)) {
          listenerExists = true;
        }
        newMapDisplay.set(mapId, !newMapDisplay.get(mapId));
        return newMapDisplay;
      });
      if (listenerExists) return;
      listeners.current[LISTENER_TYPES.ADDRESS].push(
        onSnapshot(
          query(
            collection(firestore, `congregations/${congId}/addresses`),
            where("territory", "==", territoryId),
            where("map", "==", mapId),
            orderBy("map", "asc"),
            orderBy("floor", "desc"),
            orderBy("sequence", "asc")
          ),
          (snapshot) => {
            const mapAddresses = new Map<
              string,
              Map<number, Array<unitDetails>>
            >();

            snapshot.forEach((address) => {
              const addressData = address.data();
              const mapid = addressData.map;
              const floor = addressData.floor;
              const floorDetails =
                mapAddresses.get(mapid) ||
                new Map<number, Array<unitDetails>>();

              const unitData = createUnitData(address.id, addressData);
              const unitDetails = [
                ...(floorDetails.get(floor) || []),
                unitData
              ];

              floorDetails.set(floor, unitDetails);
              mapAddresses.set(mapid, floorDetails);
            });

            setAddressData((territoryAddresses) => {
              const newTerritoryAddresses = new Map(territoryAddresses);

              mapAddresses.forEach((floorData, mapId) => {
                const addressData = newTerritoryAddresses.get(mapId);

                if (addressData) {
                  addressData.floors = Array.from(floorData.keys()).map(
                    (floorKey) => {
                      const floorUnits = floorData.get(floorKey) || [];
                      return {
                        floor: floorKey,
                        units: floorUnits
                      };
                    }
                  );

                  newTerritoryAddresses.set(mapId, addressData);
                }
              });

              return newTerritoryAddresses;
            });
          }
        )
      );
    },
    [congregationId, selectedTerritoryId]
  );

  const deleteBlock = async (
    mapId: string,
    name: string,
    showAlert: boolean
  ) => {
    if (!selectedTerritoryCode) return;
    try {
      await deleteTerritoryAddress(congregationId, mapId);
      if (showAlert) alert(`Deleted address, ${name}.`);
      await refreshCongregationTerritory(selectedTerritoryId as string);
    } catch (error) {
      errorHandler(error, rollbar);
    }
  };

  const handleUnitUpdate = (
    addressId: string,
    postal: string,
    floor: number,
    floors: Array<floorDetails>,
    unit: string,
    maxUnitNumber: number,
    name: string,
    addressData: addressDetails,
    options: Array<OptionProps>,
    userAcl: number
  ) => {
    const floorUnits = floors.find((e) => e.floor === floor);
    const unitDetails = floorUnits?.units.find((e) => e.number === unit);

    ModalManager.show(UpdateUnitStatus, {
      addressId: addressId,
      options: options,
      addressName: name,
      userAccessLevel: userAcl,
      territoryType: addressData.type,
      congregation: congregationId,
      postalCode: postal,
      unitNo: unit,
      unitNoDisplay: ZeroPad(unit, maxUnitNumber),
      floor: floor,
      floorDisplay: ZeroPad(floor.toString(), DEFAULT_FLOOR_PADDING),
      unitDetails: unitDetails,
      addressData: addressData,
      isMultiselect: true,
      updatedBy: user.displayName as string
    });
  };

  const setTimedLink = (
    linktype: number,
    mapId: string,
    territoryId: string,
    postalName: string,
    addressLinkId: string,
    hours: number,
    publisherName = ""
  ) => {
    const link = new LinkSession();
    link.endDate = addHours(hours);
    link.map = mapId;
    link.territory = territoryId;
    link.type = linktype;
    link.maxTries = policy.maxTries;
    link.user = user.uid;
    link.congregation = congregationId;
    link.name = postalName;
    link.publisherName = publisherName;
    setDoc(doc(firestore, `links/${addressLinkId}`), {
      ...link
    });
  };

  const handleSubmitPersonalSlip = async (
    map: string,
    territory: string,
    name: string,
    linkid: string,
    linkExpiryHrs: number,
    publisherName: string
  ) => {
    if (!map || !name || !linkid) return;
    try {
      shareTimedLink(
        LINK_TYPES.PERSONAL,
        map,
        name,
        territory,
        linkid,
        `Units for ${name}`,
        assignmentMessage(name),
        buildLink(linkid),
        linkExpiryHrs,
        publisherName
      );
    } catch (error) {
      errorHandler(error, rollbar);
    }
  };

  const refreshCongregationTerritory = async (selectTerritoryCode: string) => {
    if (!selectTerritoryCode) return;
    processTerritory(selectTerritoryCode);
  };

  const shareTimedLink = async (
    linktype: number,
    mapid: string,
    mapname: string,
    territoryId: string,
    linkId: string,
    title: string,
    body: string,
    url: string,
    hours: number,
    publisherName = ""
  ) => {
    if (!navigator.share) {
      alert(UNSUPPORTED_BROWSER_MSG);
      return;
    }
    try {
      setSelectedPostal(mapid);
      if (linktype === LINK_TYPES.ASSIGNMENT) setIsSettingAssignLink(true);
      if (linktype === LINK_TYPES.PERSONAL) setIsSettingPersonalLink(true);
      await setTimedLink(
        linktype,
        mapid,
        territoryId,
        mapname,
        linkId,
        hours,
        publisherName
      );
      await navigator.share({
        title: title,
        text: body,
        url: url
      });
    } catch (error) {
      errorHandler(error, rollbar, false);
    } finally {
      setIsSettingAssignLink(false);
      setIsSettingPersonalLink(false);
      setSelectedPostal("");
    }
  };

  const handleTerritorySelect = useCallback(
    (eventKey: string | null) => {
      processTerritory(eventKey as string);
      toggleTerritoryListing();
    },
    // Reset cache when the territory dropdown is selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showTerritoryListing]
  );

  const toggleTerritoryListing = useCallback(() => {
    setShowTerritoryListing(!showTerritoryListing);
  }, [showTerritoryListing]);

  const handleUserSelect = (userKey: string | null) => {
    if (!userKey) return;
    const details = congUsers.get(userKey);
    if (!details) return;
    ModalManager.show(UpdateUser, {
      uid: userKey,
      congregation: congregationId,
      footerSaveAcl: userAccessLevel,
      name: details.name,
      role: details.role
    }).then((updatedRole) => {
      setCongUsers((existingUsers) => {
        if (updatedRole === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
          existingUsers.delete(userKey);
          return new Map<string, userDetails>(existingUsers);
        }
        details.role = updatedRole as number;
        return new Map<string, userDetails>(
          existingUsers.set(userKey, details)
        );
      });
    });
  };

  const toggleUserListing = useCallback(() => {
    setShowUserListing(!showUserListing);
  }, [showUserListing]);

  const handleAddressTerritorySelect = useCallback(
    async (newTerritoryId: string | null) => {
      const details = values as valuesDetails;
      const selectedMapId = `${details.mapId}`;
      const selectedPostalCode = `${details.postal}`;

      // firestore got all the addresses for the selected territory
      const currentAdds = await getDocs(
        query(
          collection(firestore, `congregations/${congregationId}/addresses`),
          where("territory", "==", selectedTerritoryId),
          where("map", "==", selectedMapId)
        )
      );

      currentAdds.forEach((add) => {
        const addressId = add.id;
        updateDoc(
          doc(
            firestore,
            `congregations/${congregationId}/addresses/${addressId}`
          ),
          {
            territory: newTerritoryId
          }
        );
      });

      toggleAddressTerritoryListing();
      await refreshCongregationTerritory(selectedTerritoryId as string);
      alert(
        `Changed territory of ${selectedPostalCode} from ${selectedTerritoryCode} to ${newTerritoryId}.`
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showChangeAddressTerritory]
  );

  const toggleAddressTerritoryListing = useCallback(() => {
    setShowChangeAddressTerritory(!showChangeAddressTerritory);
  }, [showChangeAddressTerritory]);

  const congregationTerritoryList = useMemo(
    () => Array.from(territories.values()),
    [territories]
  );

  const getTerritoryAddressData = (addresses: Map<string, addressDetails>) => {
    const unitLengths = new Map();
    const completedPercents = new Map();
    let totalPercent = 0;

    addresses.forEach((address) => {
      const mapId = address.mapId;
      const maxUnitNumberLength = getMaxUnitLength(address.floors);
      // const completedPercent = getCompletedPercent(policy, address.floors);
      const addressProgressPercent = {
        aggregate: address.aggregate,
        done: address.done,
        notdone: address.notdone,
        nothome: address.nothome
      };
      unitLengths.set(mapId, maxUnitNumberLength);
      completedPercents.set(mapId, addressProgressPercent);
      totalPercent += address.aggregate;
    });

    const { completedValue } = processCompletedPercentage(
      totalPercent,
      100 * addresses.size
    );

    return {
      aggregate: completedValue,
      lengths: unitLengths,
      percents: completedPercents,
      data: addresses
    };
  };

  const prepareUser = useCallback(async () => {
    const congregationDocument = await getDocs(
      query(
        collection(firestore, "congregations"),
        where(`users.${user.uid}`, ">", 0)
      )
    );

    const congregations = [] as Array<CongregationProps>;

    for (const doc of congregationDocument.docs) {
      const congregation = doc.data();
      if (congregation) {
        const acl = congregation.users[user.uid];
        congregations.push({ id: doc.id, congregation, acl });
      }
    }

    // if no congregation found, then user is not authorised
    if (congregations.length === 0) {
      setIsUnauthorised(true);
      setIsLoading(false);
      return;
    }

    prepareAdmin(congregations[congregations.length - 1]);
    setCongregations(congregations);
  }, []);

  const prepareAdmin = async (congregationDocument: CongregationProps) => {
    refreshState([
      LISTENER_TYPES.MAP,
      LISTENER_TYPES.ADDRESS,
      LISTENER_TYPES.LINK,
      LISTENER_TYPES.TERRITORY
    ]);
    const congregationId = congregationDocument?.id;
    const congregationData = congregationDocument?.congregation;
    setUserAccessLevel(congregationDocument?.acl);
    setCongregationId(congregationId);
    const options = await getOptions(congregationId);
    setOptions(options);

    setPolicy(
      new Policy(
        await user.getIdTokenResult(true),
        options,
        congregationData?.max_tries,
        congregationData?.multi_type
      )
    );

    setName(congregationData?.name);
    setDefaultExpiryHours(congregationData?.expiry_hours);

    listeners.current[LISTENER_TYPES.TERRITORY].push(
      onSnapshot(
        query(
          collection(firestore, `congregations/${congregationId}/territories`),
          orderBy("code")
        ),
        (snapshot) => {
          const territories = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              code: data.code,
              name: data.name
            };
          });

          const territoryList = new Map<string, territoryDetails>();
          territories.forEach((territory) => {
            territoryList.set(territory.code, territory);
            // check if territory is selected and if so, update the territory name
            if (territory.id === selectedTerritoryId) {
              setSelectedTerritoryName(territory.name);
              setSelectedTerritoryCode(territory.code);
            }
          });
          setTerritories(territoryList);
        },
        (error) => {
          console.error("Error fetching territories: ", error);
        }
      )
    );

    setIsLoading(false);
  };

  useEffect(() => {
    prepareUser();
    window.addEventListener("scroll", () => {
      setShowBkTopButton(window.scrollY > PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY);
    });
  }, [user]);

  const territoryAddressData = useMemo(
    () => getTerritoryAddressData(addressData),
    [addressData]
  );

  if (isLoading) return <Loader />;
  if (isUnauthorised)
    return (
      <UnauthorizedPage handleClick={logoutUser} name={`${user.displayName}`} />
    );
  const isAdmin = userAccessLevel === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;
  // const isReadonly = userAccessLevel === USER_ACCESS_LEVELS.READ_ONLY.CODE;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      {/* <EnvironmentIndicator
        environment={import.meta.env.VITE_ROLLBAR_ENVIRONMENT}
      /> */}
      {/* <TerritoryListing
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
        users={Array.from(congUsers.values())}
        currentUid={user.uid}
        hideFunction={toggleUserListing}
        handleSelect={handleUserSelect}
      /> */}
      {/* <Header /> */}
      {/* <Sidebar /> */}
      <Sheet
        sx={{
          display: { xs: "flex", md: "flex" },
          alignItems: "center",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          width: "100vw",
          height: "var(--Header-height)",
          zIndex: 9995,
          p: 2,
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "background.level1",
          boxShadow: "sm"
        }}
      >
        <IconButton
          onClick={() => toggleSidebar()}
          variant="outlined"
          color="neutral"
          size="sm"
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
          <ColorSchemeToggle sx={{ alignSelf: "center" }} />
          <Box
            sx={{
              gap: 1,
              alignItems: "center",
              display: { xs: "none", sm: "flex" }
            }}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography level="title-sm">{user.displayName}</Typography>
                <Typography level="body-xs">{user.email}</Typography>
              </Box>
              <IconButton size="sm" variant="plain" color="neutral">
                <LogoutRoundedIcon onClick={() => logoutUser()} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Sheet>
      <Sheet
        // className="Sidebar"
        sx={{
          position: { xs: "fixed", md: "sticky" },
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
            md: "none"
          },
          transition: "transform 0.4s, width 0.4s",
          zIndex: 9996,
          height: "100vh",
          width: "var(--Sidebar-width)",
          top: 0,
          p: 2,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRight: "1px solid",
          borderColor: "divider"
        }}
      >
        <Box
          className="Sidebar-overlay"
          sx={{
            position: "fixed",
            // zIndex: 9998,
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            opacity: "var(--SideNavigation-slideIn)",
            backgroundColor: "var(--joy-palette-background-backdrop)",
            transition: "opacity 0.4s",
            transform: {
              xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))",
              lg: "translateX(-100%)"
            }
          }}
          onClick={() => closeSidebar()}
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <IconButton disabled variant="plain">
            <img src="favicon-32x32.png" alt="Ministry Mapper Icon" />
          </IconButton>
          <Typography level="title-sm">{name}</Typography>
        </Box>
        <Box
          sx={{
            minHeight: 0,
            overflow: "hidden auto",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            [`& .${listItemButtonClasses.root}`]: {
              gap: 1.5
            }
          }}
        >
          <List
            size="sm"
            sx={{
              gap: 1,
              "--List-nestedInsetStart": "30px",
              "--ListItem-radius": (theme) => theme.vars.radius.sm
            }}
          >
            <ListItem>
              <ListItemButton onClick={() => ModalManager.show(Login)}>
                <HomeRoundedIcon />
                <ListItemContent>
                  <Typography level="title-sm">Login</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton>
                <DashboardRoundedIcon />
                <ListItemContent>
                  <Typography level="title-sm">Dashboard</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton>
                <ShoppingCartRoundedIcon />
                <ListItemContent>
                  <Typography level="title-sm">Orders</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
            {congregations.length > 1 && (
              <ListItem nested>
                <Toggler
                  renderToggle={({ open, setOpen }) => (
                    <ListItemButton onClick={() => setOpen(!open)}>
                      <HomeWorkIcon />
                      <ListItemContent>
                        <Typography level="title-sm">Congregations</Typography>
                      </ListItemContent>
                      <KeyboardArrowDownIcon
                        sx={{ transform: open ? "rotate(180deg)" : "none" }}
                      />
                    </ListItemButton>
                  )}
                >
                  <List sx={{ gap: 0.5 }}>
                    {congregations.map((congregation) => (
                      <ListItem key={congregation.id} sx={{ mt: 0.5 }}>
                        <ListItemButton
                          selected={congregation.id === congregationId}
                          onClick={() => prepareAdmin(congregation)}
                        >
                          {congregation.congregation.name}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Toggler>
              </ListItem>
            )}

            {congregationTerritoryList.length > 0 && (
              <ListItem nested>
                <Toggler
                  renderToggle={({ open, setOpen }) => (
                    <ListItemButton onClick={() => setOpen(!open)}>
                      <MapIcon />
                      <ListItemContent>
                        <Typography level="title-sm">Territories</Typography>
                      </ListItemContent>
                      <KeyboardArrowDownIcon
                        sx={{ transform: open ? "rotate(180deg)" : "none" }}
                      />
                    </ListItemButton>
                  )}
                >
                  <List sx={{ gap: 0.5 }}>
                    {congregationTerritoryList.map((territory) => (
                      <ListItem key={territory.id} sx={{ mt: 0.5 }}>
                        <ListItemButton
                          selected={territory.id === selectedTerritoryId}
                          onClick={() => {
                            processTerritory(territory.id as string);
                            closeSidebar();
                          }}
                        >
                          {territory.code}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Toggler>
              </ListItem>
            )}

            <ListItem nested>
              <Toggler
                renderToggle={({ open, setOpen }) => (
                  <ListItemButton onClick={() => setOpen(!open)}>
                    <ManageAccountsIcon />
                    <ListItemContent>
                      <Typography level="title-sm">Manage</Typography>
                    </ListItemContent>
                    <KeyboardArrowDownIcon
                      sx={{ transform: open ? "rotate(180deg)" : "none" }}
                    />
                  </ListItemButton>
                )}
              >
                <List sx={{ gap: 0.5 }}>
                  <ListSubheader>Territory</ListSubheader>
                  <ListItem sx={{ mt: 0.5 }}>
                    <ListItemButton
                      onClick={() =>
                        ModalManager.show(NewTerritoryCode, {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId
                        })
                      }
                    >
                      New
                    </ListItemButton>
                  </ListItem>
                  <ListItem>
                    <ListItemButton
                      disabled={!selectedTerritoryCode}
                      onClick={() =>
                        ModalManager.show(ChangeTerritoryCode, {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId,
                          territoryCode: selectedTerritoryCode,
                          territoryId: selectedTerritoryId
                        })
                      }
                    >
                      Change Code
                    </ListItemButton>
                  </ListItem>
                  <ListItem>
                    <ListItemButton
                      disabled={!selectedTerritoryCode}
                      onClick={() =>
                        ModalManager.show(ConfirmationDialog, {
                          title: "Delete Territory",
                          message: `This action will delete the territory, ${selectedTerritoryCode} - ${selectedTerritoryName} and all its addresses.`
                        }).then(() => {
                          deleteTerritory(
                            congregationId,
                            selectedTerritoryId as string
                          );
                          refreshState([
                            LISTENER_TYPES.MAP,
                            LISTENER_TYPES.ADDRESS
                          ]);
                        })
                      }
                      // onClick={() =>
                      //   confirmAlert({
                      //     customUI: ({ onClose }) => {
                      //       return (
                      //         <Container>
                      //           <Card bg="warning" className="text-center">
                      //             <Card.Header>
                      //               Warning ⚠️
                      //               <HelpButton
                      //                 link={WIKI_CATEGORIES.DELETE_TERRITORIES}
                      //                 isWarningButton={true}
                      //               />
                      //             </Card.Header>
                      //             <Card.Body>
                      //               <Card.Title>Are You Very Sure ?</Card.Title>
                      //               <Card.Text>
                      //                 This action will delete the territory,{" "}
                      //                 {selectedTerritoryCode} -{" "}
                      //                 {selectedTerritoryName} and all its
                      //                 addresses.
                      //               </Card.Text>
                      //               <Button
                      //                 className="m-1"
                      //                 variant="primary"
                      //                 onClick={() => {
                      //                   deleteTerritory(
                      //                     congregationId,
                      //                     selectedTerritoryId as string
                      //                   );
                      //                   refreshState([
                      //                     LISTENER_TYPES.MAP,
                      //                     LISTENER_TYPES.ADDRESS
                      //                   ]);
                      //                   onClose();
                      //                 }}
                      //               >
                      //                 Yes, Delete It.
                      //               </Button>
                      //               <Button
                      //                 className="no-confirm-btn"
                      //                 variant="primary"
                      //                 onClick={() => {
                      //                   onClose();
                      //                 }}
                      //               >
                      //                 No
                      //               </Button>
                      //             </Card.Body>
                      //           </Card>
                      //         </Container>
                      //       );
                      //     }
                      //   })
                      // }
                    >
                      Delete
                    </ListItemButton>
                  </ListItem>
                  <ListItem>
                    <ListItemButton
                      disabled={!selectedTerritoryCode}
                      onClick={() =>
                        ModalManager.show(ChangeTerritoryName, {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId,
                          territoryId: selectedTerritoryId,
                          name: selectedTerritoryName
                        })
                      }
                    >
                      Change Name
                    </ListItemButton>
                  </ListItem>
                  <ListItem>
                    <ListItemButton
                      disabled={!selectedTerritoryCode}
                      onClick={() =>
                        ModalManager.show(ConfirmationDialog, {
                          title: "Reset Territory",
                          message: `This action will reset the status of all addresses in the territory, ${selectedTerritoryCode} - ${selectedTerritoryName}.`
                        }).then(() => {
                          ResetAddresses(
                            congregationId,
                            "",
                            selectedTerritoryId as string
                          );
                        })
                      }
                      // onClick={() =>
                      //   confirmAlert({
                      //     customUI: ({ onClose }) => {
                      //       return (
                      //         <Container>
                      //           <Card bg="warning" className="text-center">
                      //             <Card.Header>
                      //               Warning ⚠️
                      //               <HelpButton
                      //                 link={WIKI_CATEGORIES.RESET_TERRITORIES}
                      //                 isWarningButton={true}
                      //               />
                      //             </Card.Header>
                      //             <Card.Body>
                      //               <Card.Title>Are You Very Sure ?</Card.Title>
                      //               <Card.Text>
                      //                 <p>
                      //                   This action will reset the status of all
                      //                   addresses in the territory,{" "}
                      //                   {selectedTerritoryCode} -{" "}
                      //                   {selectedTerritoryName}.
                      //                 </p>
                      //                 <p>
                      //                   Certain statuses such as DNC and Invalid
                      //                   will not be affected.
                      //                 </p>
                      //               </Card.Text>
                      //               <Button
                      //                 className="m-1"
                      //                 variant="primary"
                      //                 onClick={() => {
                      //                   ResetAddresses(
                      //                     congregationId,
                      //                     "",
                      //                     selectedTerritoryId as string
                      //                   );
                      //                   onClose();
                      //                 }}
                      //               >
                      //                 Yes, Reset them.
                      //               </Button>
                      //               <Button
                      //                 className="no-confirm-btn"
                      //                 variant="primary"
                      //                 onClick={() => {
                      //                   onClose();
                      //                 }}
                      //               >
                      //                 No
                      //               </Button>
                      //             </Card.Body>
                      //           </Card>
                      //         </Container>
                      //       );
                      //     }
                      //   })
                      // }
                    >
                      Reset
                    </ListItemButton>
                  </ListItem>
                  <ListSubheader about="test">Map</ListSubheader>
                  <ListItem sx={{ mt: 0.5 }}>
                    <ListItemButton
                      disabled={!selectedTerritoryCode}
                      onClick={() =>
                        ModalManager.show(NewPublicAddress, {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId,
                          territoryId: selectedTerritoryId,
                          defaultType: policy.defaultType
                        }).then(
                          async () =>
                            await refreshCongregationTerritory(
                              selectedTerritoryId || ""
                            )
                        )
                      }
                    >
                      New Public
                    </ListItemButton>
                  </ListItem>
                  <ListItem>
                    <ListItemButton
                      disabled={!selectedTerritoryCode}
                      onClick={() =>
                        ModalManager.show(NewPrivateAddress, {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId,
                          territoryId: selectedTerritoryId,
                          defaultType: policy.defaultType
                        }).then(
                          async () =>
                            await refreshCongregationTerritory(
                              selectedTerritoryId as string
                            )
                        )
                      }
                    >
                      New Private
                    </ListItemButton>
                  </ListItem>
                </List>
              </Toggler>
            </ListItem>

            <ListItem>
              <ListItemButton
                role="menuitem"
                component="a"
                href="/joy-ui/getting-started/templates/messages/"
              >
                <QuestionAnswerRoundedIcon />
                <ListItemContent>
                  <Typography level="title-sm">Messages</Typography>
                </ListItemContent>
                <Chip size="sm" color="primary" variant="solid">
                  4
                </Chip>
              </ListItemButton>
            </ListItem>
            <ListItem nested>
              <Toggler
                renderToggle={({ open, setOpen }) => (
                  <ListItemButton onClick={() => setOpen(!open)}>
                    <ManageAccountsIcon />
                    <ListItemContent>
                      <Typography level="title-sm">Account</Typography>
                    </ListItemContent>
                    <KeyboardArrowDownIcon
                      sx={{ transform: open ? "rotate(180deg)" : "none" }}
                    />
                  </ListItemButton>
                )}
              >
                <List sx={{ gap: 0.5 }}>
                  <ListItem sx={{ mt: 0.5 }}>
                    <ListItemButton
                      onClick={() =>
                        ModalManager.show(GetProfile, {
                          user: user
                        })
                      }
                    >
                      My profile
                    </ListItemButton>
                  </ListItem>
                  <ListItem>
                    <ListItemButton
                      onClick={() =>
                        ModalManager.show(ChangePassword, {
                          user: user,
                          userAccessLevel: userAccessLevel
                        })
                      }
                    >
                      Change Password
                    </ListItemButton>
                  </ListItem>
                </List>
              </Toggler>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <SupportRoundedIcon />
                Support
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <SettingsRoundedIcon />
                Settings
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Sheet>
      <Box
        // component="main"
        sx={{
          px: { xs: 2, md: 6 },
          pt: {
            xs: "calc(12px + var(--Header-height))",
            sm: "calc(12px + var(--Header-height))",
            md: "calc(3rem + var(--Header-height))"
          },
          pb: { xs: 2, sm: 2, md: 3 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100%", // Changed from height to minHeight
          overflow: "auto", // Added to enable scrolling
          gap: 1
        }}
      >
        <Stack gap={3}>
          {Array.from(territoryAddressData.data.keys()).map((currentMapId) => {
            const mapElement = territoryAddressData.data.get(currentMapId);

            if (!mapElement)
              return <div key={`empty-div-${currentMapId}`}></div>;
            const currentPostalcode = mapElement.postalCode;
            const currentMapName = mapElement.name;
            const maxUnitNumberLength =
              territoryAddressData.lengths.get(currentMapId);
            const progressPercentages =
              territoryAddressData.percents.get(currentMapId);
            const addressLinkId = nanoid();
            const assigneeCount =
              assignmentLinks.get(currentMapId)?.length || 0;
            const personalCount = personalLinks.get(currentMapId)?.length || 0;

            return (
              <Card
                variant="outlined"
                orientation="horizontal"
                sx={{
                  bgcolor: "neutral.softBg",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  "&:hover": {
                    boxShadow: "lg",
                    borderColor:
                      "var(--joy-palette-neutral-outlinedDisabledBorder)"
                  }
                }}
                key={`card-${currentMapId}`}
              >
                <CardContent
                  sx={{
                    overflow: "hidden"
                  }}
                >
                  <Stack
                    spacing={1}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <div>
                      <Typography level="body-sm"></Typography>
                      <Typography level="title-md">{currentMapName}</Typography>
                    </div>
                    <IconButton
                      variant="plain"
                      size="sm"
                      sx={{
                        display: { xs: "none", sm: "flex" },
                        borderRadius: "50%"
                      }}
                    ></IconButton>
                    <Dropdown
                      sx={{
                        display: { xs: "none", sm: "flex" },
                        borderRadius: "50%"
                      }}
                    >
                      <MenuButton
                        slots={{ root: IconButton }}
                        slotProps={{
                          root: { variant: "outlined", color: "neutral" }
                        }}
                      >
                        <MoreVert />
                      </MenuButton>
                      <Menu placement="bottom-end">
                        <MenuItem
                          onClick={() =>
                            ModalManager.show(ChangeAddressPostalCode, {
                              footerSaveAcl: userAccessLevel,
                              congregation: congregationId,
                              postalCode: currentPostalcode,
                              mapId: currentMapId
                            })
                          }
                        >
                          <ListItemDecorator>
                            <Edit />
                          </ListItemDecorator>{" "}
                          Change Postal
                        </MenuItem>
                        <MenuItem
                          onClick={() =>
                            ModalManager.show(ChangeAddressName, {
                              congregation: congregationId,
                              footerSaveAcl: userAccessLevel,
                              mapId: currentMapId,
                              name: currentMapName
                            })
                          }
                        >
                          <ListItemDecorator />
                          Change Name
                        </MenuItem>
                        <ListDivider />
                        <MenuItem
                          onClick={() =>
                            ModalManager.show(NewUnit, {
                              mapId: currentMapId,
                              footerSaveAcl: userAccessLevel,
                              addressData: mapElement,
                              defaultType: policy.defaultType,
                              congregation: congregationId,
                              addressName: currentMapName
                            })
                          }
                        >
                          <ListItemDecorator>
                            <Add />
                          </ListItemDecorator>{" "}
                          Add{" "}
                          {mapElement.type === TERRITORY_TYPES.PRIVATE
                            ? "Property"
                            : "Unit"}
                        </MenuItem>
                        {(!mapElement.type ||
                          mapElement.type === TERRITORY_TYPES.PUBLIC) && (
                          <MenuItem
                            onClick={() =>
                              adjustAddressFloor(
                                congregationId,
                                currentMapId,
                                policy.defaultType
                              )
                            }
                          >
                            <ListItemDecorator>
                              <Add />
                            </ListItemDecorator>{" "}
                            Add Higher Floor
                          </MenuItem>
                        )}
                        {(!mapElement.type ||
                          mapElement.type === TERRITORY_TYPES.PUBLIC) && (
                          <MenuItem
                            onClick={() =>
                              adjustAddressFloor(
                                congregationId,
                                currentMapId,
                                policy.defaultType,
                                false
                              )
                            }
                          >
                            <ListItemDecorator>
                              <Add />
                            </ListItemDecorator>{" "}
                            Add Lower Floor
                          </MenuItem>
                        )}

                        <ListDivider />
                        <MenuItem
                          onClick={() =>
                            ModalManager.show(ConfirmationDialog, {
                              title: "Delete Address",
                              message: `The action will completely delete, ${currentMapName}.`
                            }).then(() => {
                              deleteBlock(currentMapId, currentMapName, true);
                            })
                          }
                        >
                          <ListItemDecorator>
                            <DeleteForever />
                          </ListItemDecorator>{" "}
                          Delete
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            ModalManager.show(ConfirmationDialog, {
                              title: "Reset Address",
                              message: `This action will reset all
                              address status of ${currentMapName}. Certain statuses such as DNC and
                              Invalid will not be affected.`
                            }).then(() => {
                              ResetAddresses(congregationId, currentMapId);
                            });
                          }}
                        >
                          <ListItemDecorator>
                            <DeleteForever />
                          </ListItemDecorator>{" "}
                          Reset
                        </MenuItem>
                      </Menu>
                    </Dropdown>
                  </Stack>
                  <Stack
                    spacing={1}
                    direction="row"
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ my: 0.25 }}
                  >
                    <Typography
                      level="body-xs"
                      startDecorator={<NightShelterIcon />}
                    >
                      80%
                    </Typography>
                    <Typography
                      level="body-xs"
                      startDecorator={<CheckBoxIcon />}
                    >
                      50%
                    </Typography>
                    <Typography
                      level="body-xs"
                      startDecorator={<IndeterminateCheckBoxIcon />}
                    >
                      20%
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction="row">
                    <Sheet
                      sx={{
                        display: "flex",
                        gap: 1,
                        bgcolor: "neutral.softBg"
                      }}
                    >
                      <Button
                        size="sm"
                        startDecorator={<ShareIcon />}
                        onClick={() => {
                          if (!navigator.share) {
                            setSnackbarAlert({
                              open: true,
                              color: "danger",
                              message: UNSUPPORTED_BROWSER_MSG
                            });
                            return;
                          }
                          ModalManager.show(ConfirmSlipDetails, {
                            addressName: currentMapName,
                            userAccessLevel: userAccessLevel,
                            isPersonalSlip: true,
                            defaultExpiryHrs: defaultExpiryHours,
                            addresses: mapElement.floors,
                            type: mapElement.type
                          }).then((linkReturn) => {
                            const linkObject = linkReturn as Record<
                              string,
                              unknown
                            >;
                            handleSubmitPersonalSlip(
                              currentMapId,
                              selectedTerritoryId as string,
                              currentMapName,
                              addressLinkId,
                              linkObject.linkExpiryHrs as number,
                              linkObject.publisherName as string
                            );
                          });
                        }}
                      >
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        startDecorator={<ShareIcon />}
                        onClick={() => {
                          window.open(
                            GetDirection(currentPostalcode),
                            "_blank"
                          );
                        }}
                      >
                        Direction
                      </Button>
                    </Sheet>
                    <Sheet
                      sx={{
                        flexGrow: 1,
                        textAlign: "right",
                        bgcolor: "neutral.softBg"
                      }}
                    >
                      <Button
                        size="sm"
                        startDecorator={<ShareIcon />}
                        onClick={() => {
                          configureMapListener(
                            currentMapId,
                            selectedTerritoryId as string,
                            congregationId as string
                          );
                        }}
                      >
                        Map
                      </Button>
                    </Sheet>
                  </Stack>
                  <Stack
                    spacing={1}
                    sx={{
                      transition: "max-height 0.5s ease-in-out",
                      maxHeight: !mapDisplay.get(currentMapId) ? 0 : "100%"
                    }}
                  >
                    <Sheet
                      sx={{ height: 300, width: "100%", overflowX: "auto" }}
                    >
                      <AdminTable
                        floors={mapElement.floors}
                        maxUnitNumberLength={maxUnitNumberLength}
                        policy={policy}
                        completedPercent={progressPercentages}
                        postalCode={currentMapId}
                        territoryType={mapElement.type}
                        userAccessLevel={userAccessLevel}
                        handleUnitStatusUpdate={(event) => {
                          const { floor, unitno, addressid } =
                            event.currentTarget.dataset;
                          handleUnitUpdate(
                            addressid as string,
                            currentPostalcode,
                            Number(floor),
                            mapElement.floors,
                            unitno as string,
                            maxUnitNumberLength,
                            currentMapName,
                            mapElement,
                            options,
                            userAccessLevel as number
                          );
                        }}
                        adminUnitHeaderStyle={`${
                          isAdmin ? "admin-unit-header " : ""
                        }`}
                        handleUnitNoUpdate={(event) => {
                          const { sequence, unitno, length } =
                            event.currentTarget.dataset;
                          if (!isAdmin) return;
                          ModalManager.show(UpdateUnit, {
                            mapId: currentMapId,
                            name: currentMapName,
                            unitNo: unitno || "",
                            unitLength: Number(length),
                            unitSequence:
                              sequence === undefined
                                ? undefined
                                : Number(sequence),
                            unitDisplay: ZeroPad(
                              unitno || "",
                              maxUnitNumberLength
                            ),
                            addressData: mapElement,
                            congregation: congregationId
                          });
                        }}
                        handleFloorDelete={(event) => {
                          const { floor } = event.currentTarget.dataset;
                          const hasOnlyOneFloor =
                            mapElement.floors.length === 1;
                          if (hasOnlyOneFloor) {
                            setSnackbarAlert({
                              open: true,
                              color: "danger",
                              message: `Territory requires at least 1 floor.`
                            });
                            return;
                          }
                          ModalManager.show(ConfirmationDialog, {
                            title: "Delete Floor",
                            message: `This action will delete floor ${floor} of ${currentMapId}.`
                          }).then(() => {
                            deleteBlockFloor(
                              congregationId,
                              currentMapId,
                              Number(floor)
                            );
                          });
                        }}
                      ></AdminTable>
                    </Sheet>
                  </Stack>
                </CardContent>
                {/* <Card.Header
                  className="d-flex justify-content-between align-items-center"
                  style={{ flexDirection: "column" }}
                >
                  <div>
                    <span className="fluid-bolding fluid-text">
                      {currentMapName}
                    </span>
                  </div>
                  <hr style={{ width: "100%", margin: "10px 0" }} />
                  <ProgressBar style={{ borderRadius: 0, width: "100%" }}>
                    <ProgressBar
                      striped
                      variant="success"
                      now={progressPercentages?.done}
                      key={1}
                      label="done"
                    />
                    <ProgressBar
                      variant="warning"
                      now={progressPercentages?.nothome}
                      key={2}
                      label="not home"
                    />
                    <ProgressBar
                      striped
                      variant="danger"
                      now={progressPercentages?.notdone}
                      key={3}
                      label="not done"
                    />
                  </ProgressBar>
                  <div>
                    <ButtonToolbar>
                      <ComponentAuthorizer
                        requiredPermission={
                          USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                        }
                        userPermission={userAccessLevel}
                      >
                        <ButtonGroup className="m-1">
                          <Button
                            key={`assigndrop-${currentMapId}`}
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              if (!navigator.share) {
                                alert(UNSUPPORTED_BROWSER_MSG);
                                return;
                              }
                              ModalManager.show(ConfirmSlipDetails, {
                                addressName: currentMapName,
                                userAccessLevel: userAccessLevel,
                                isPersonalSlip: true
                              }).then((linkReturn) => {
                                const linkObject = linkReturn as Record<
                                  string,
                                  unknown
                                >;
                                handleSubmitPersonalSlip(
                                  currentMapId,
                                  selectedTerritoryId as string,
                                  currentMapName,
                                  addressLinkId,
                                  linkObject.linkExpiryHrs as number,
                                  linkObject.publisherName as string
                                );
                              });
                            }}
                          >
                            Personal
                          </Button>
                          {(isSettingPersonalLink &&
                            selectedPostal === currentMapId && (
                              <Button size="sm" variant="outline-primary">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  aria-hidden="true"
                                />{" "}
                              </Button>
                            )) ||
                            (personalCount > 0 && (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  ModalManager.show(GetAssignments, {
                                    assignments:
                                      personalLinks.get(currentMapId) || [],
                                    assignmentType: LINK_TYPES.PERSONAL,
                                    assignmentTerritory: currentMapName,
                                    congregation: congregationId
                                  })
                                }
                              >
                                <Badge bg="danger" className="me-1">
                                  {personalCount}
                                </Badge>
                              </Button>
                            ))}
                        </ButtonGroup>
                      </ComponentAuthorizer>
                      <ComponentAuthorizer
                        requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                        userPermission={userAccessLevel}
                      >
                        <ButtonGroup className="m-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              if (!navigator.share) {
                                alert(UNSUPPORTED_BROWSER_MSG);
                                return;
                              }
                              ModalManager.show(ConfirmSlipDetails, {
                                addressName: currentMapName,
                                userAccessLevel: userAccessLevel,
                                isPersonalSlip: false
                              }).then((linkReturn) => {
                                const linkObject = linkReturn as Record<
                                  string,
                                  unknown
                                >;
                                shareTimedLink(
                                  LINK_TYPES.ASSIGNMENT,
                                  currentMapId,
                                  currentMapName,
                                  selectedTerritoryId as string,
                                  addressLinkId,
                                  `Units for ${currentMapName}`,
                                  assignmentMessage(currentMapName),
                                  buildLink(addressLinkId),
                                  defaultExpiryHours,
                                  linkObject.publisherName as string
                                );
                              });
                            }}
                          >
                            Assign
                          </Button>
                          {(isSettingAssignLink &&
                            selectedPostal === currentMapId && (
                              <Button size="sm" variant="outline-primary">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  aria-hidden="true"
                                />{" "}
                              </Button>
                            )) ||
                            (assigneeCount > 0 && (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  ModalManager.show(GetAssignments, {
                                    assignments:
                                      assignmentLinks.get(currentMapId) || [],
                                    assignmentType: LINK_TYPES.ASSIGNMENT,
                                    assignmentTerritory: currentMapName,
                                    congregation: congregationId
                                  })
                                }
                              >
                                <Badge bg="danger" className="me-1">
                                  {assigneeCount}
                                </Badge>
                              </Button>
                            ))}
                        </ButtonGroup>
                      </ComponentAuthorizer>
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
                          title="Address"
                        >
                          <Dropdown.Item
                            onClick={() =>
                              ModalManager.show(ChangeAddressPostalCode, {
                                footerSaveAcl: userAccessLevel,
                                congregation: congregationId,
                                postalCode: currentPostalcode,
                                mapId: currentMapId
                              })
                            }
                          >
                            Change Postal Code
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => {
                              setValues({
                                ...values,
                                mapId: currentMapId,
                                postal: currentPostalcode
                              });
                              toggleAddressTerritoryListing();
                            }}
                          >
                            Change Territory
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              ModalManager.show(ChangeAddressName, {
                                congregation: congregationId,
                                footerSaveAcl: userAccessLevel,
                                mapId: currentMapId,
                                name: currentMapName
                              }).then((updatedName) =>
                                // update territory state with new name
                                setAddressData((existingAddresses) => {
                                  const address =
                                    existingAddresses.get(currentMapId);
                                  if (!address) return existingAddresses;
                                  address.name = updatedName as string;
                                  return new Map<string, addressDetails>(
                                    existingAddresses.set(currentMapId, address)
                                  );
                                })
                              )
                            }
                          >
                            Rename
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              ModalManager.show(NewUnit, {
                                mapId: currentMapId,
                                footerSaveAcl: userAccessLevel,
                                addressData: mapElement,
                                defaultType: policy.defaultType,
                                congregation: congregationId,
                                addressName: currentMapName
                              })
                            }
                          >
                            Add{" "}
                            {mapElement.type === TERRITORY_TYPES.PRIVATE
                              ? "Property"
                              : "Unit"}{" "}
                            No.
                          </Dropdown.Item>
                          {(!mapElement.type ||
                            mapElement.type === TERRITORY_TYPES.PUBLIC) && (
                            <Dropdown.Item
                              onClick={() => {
                                // addFloorToBlock(currentMapId);
                                adjustAddressFloor(
                                  congregationId,
                                  currentMapId,
                                  policy.defaultType
                                );
                              }}
                            >
                              Add Higher Floor
                            </Dropdown.Item>
                          )}
                          {(!mapElement.type ||
                            mapElement.type === TERRITORY_TYPES.PUBLIC) && (
                            <Dropdown.Item
                              onClick={() => {
                                adjustAddressFloor(
                                  congregationId,
                                  currentMapId,
                                  policy.defaultType,
                                  false
                                );
                              }}
                            >
                              Add Lower Floor
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item
                            onClick={() =>
                              confirmAlert({
                                customUI: ({ onClose }) => {
                                  return (
                                    <Container>
                                      <Card
                                        bg="warning"
                                        className="text-center"
                                      >
                                        <Card.Header>
                                          Warning ⚠️
                                          <HelpButton
                                            link={WIKI_CATEGORIES.RESET_ADDRESS}
                                            isWarningButton={true}
                                          />
                                        </Card.Header>
                                        <Card.Body>
                                          <Card.Title>
                                            Are You Very Sure ?
                                          </Card.Title>
                                          <Card.Text>
                                            <p>
                                              This action will reset all
                                              property status of{" "}
                                              {currentMapName}.
                                            </p>
                                            <p>
                                              Certain statuses such as DNC and
                                              Invalid will not be affected.
                                            </p>
                                          </Card.Text>
                                          <Button
                                            className="m-1"
                                            variant="primary"
                                            onClick={() => {
                                              ResetAddresses(
                                                congregationId,
                                                currentMapId
                                              );
                                              onClose();
                                            }}
                                          >
                                            Yes, Reset It.
                                          </Button>
                                          <Button
                                            className="no-confirm-btn"
                                            variant="primary"
                                            onClick={() => {
                                              onClose();
                                            }}
                                          >
                                            No
                                          </Button>
                                        </Card.Body>
                                      </Card>
                                    </Container>
                                  );
                                }
                              })
                            }
                          >
                            Reset Status
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              confirmAlert({
                                customUI: ({ onClose }) => {
                                  return (
                                    <Container>
                                      <Card
                                        bg="warning"
                                        className="text-center"
                                      >
                                        <Card.Header>
                                          Warning ⚠️
                                          <HelpButton
                                            link={
                                              WIKI_CATEGORIES.DELETE_ADDRESS
                                            }
                                            isWarningButton={true}
                                          />
                                        </Card.Header>
                                        <Card.Body>
                                          <Card.Title>
                                            Are You Very Sure ?
                                          </Card.Title>
                                          <Card.Text>
                                            The action will completely delete,{" "}
                                            {currentMapName}.
                                          </Card.Text>
                                          <Button
                                            className="m-1"
                                            variant="primary"
                                            onClick={() => {
                                              deleteBlock(
                                                currentMapId,
                                                currentMapName,
                                                true
                                              );
                                              onClose();
                                            }}
                                          >
                                            Yes, Delete It.
                                          </Button>
                                          <Button
                                            className="no-confirm-btn"
                                            variant="primary"
                                            onClick={() => {
                                              onClose();
                                            }}
                                          >
                                            No
                                          </Button>
                                        </Card.Body>
                                      </Card>
                                    </Container>
                                  );
                                }
                              })
                            }
                          >
                            Delete
                          </Dropdown.Item>
                        </DropdownButton>
                      </ComponentAuthorizer>
                      <ButtonGroup className="my-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          // className="m-1"
                          onClick={async () => {
                            setIsSettingViewLink(true);
                            try {
                              const territoryWindow = window.open("");
                              if (territoryWindow) {
                                territoryWindow.document.body.innerHTML =
                                  TERRITORY_VIEW_WINDOW_WELCOME_TEXT;
                              }
                              await setTimedLink(
                                LINK_TYPES.VIEW,
                                currentMapId,
                                currentMapName,
                                selectedTerritoryId as string,
                                addressLinkId,
                                defaultExpiryHours,
                                user.displayName || ""
                              );
                              if (territoryWindow) {
                                territoryWindow.location.href =
                                  buildLink(addressLinkId);
                              }
                            } catch (error) {
                              errorHandler(error, rollbar);
                            } finally {
                              setIsSettingViewLink(false);
                            }
                          }}
                        >
                          {isSettingViewLink && (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                aria-hidden="true"
                              />{" "}
                            </>
                          )}
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          // className="m-1"
                          onClick={() =>
                            window.open(
                              GetDirection(currentPostalcode),
                              "_blank"
                            )
                          }
                        >
                          Direction
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          // className="m-1"
                          onClick={() =>
                            ModalManager.show(UpdateAddressFeedback, {
                              mapId: currentMapId,
                              footerSaveAcl: userAccessLevel,
                              name: currentMapName,
                              congregation: congregationId,
                              postalCode: currentPostalcode,
                              currentFeedback: mapElement.feedback,
                              currentName: user.displayName as string,
                              helpLink:
                                WIKI_CATEGORIES.CONDUCTOR_ADDRESS_FEEDBACK
                            })
                          }
                        >
                          <span
                            className={mapElement.feedback ? "blinking" : ""}
                          >
                            Feedback
                          </span>
                        </Button>
                        <InstructionsButton
                          instructions={mapElement.instructions}
                          handleSave={() =>
                            ModalManager.show(UpdateAddressInstructions, {
                              congregation: congregationId,
                              mapId: currentMapId,
                              userAccessLevel: userAccessLevel,
                              addressName: currentMapName,
                              instructions: mapElement.instructions,
                              userName: user.displayName as string
                            }).then((updatedInstructions) =>
                              setAddressData((existingAddresses) => {
                                const address =
                                  existingAddresses.get(currentMapId);
                                if (!address) return existingAddresses;
                                address.instructions =
                                  updatedInstructions as string;
                                return new Map<string, addressDetails>(
                                  existingAddresses.set(currentMapId, address)
                                );
                              })
                            )
                          }
                          userAcl={userAccessLevel}
                        />
                      </ButtonGroup>
                      <ButtonGroup>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="m-1"
                          onClick={() =>
                            configureMapListener(
                              currentMapId,
                              selectedTerritoryId as string,
                              congregationId as string
                            )
                          }
                        >
                          ⬇️
                        </Button>
                      </ButtonGroup>
                    </ButtonToolbar>
                  </div>
                </Card.Header> */}
                {/* <Collapse in={mapDisplay.get(currentMapId) || false}> */}
                {/* <Card.Body>
                    <AdminTable
                      floors={mapElement.floors}
                      maxUnitNumberLength={maxUnitNumberLength}
                      policy={policy}
                      completedPercent={progressPercentages}
                      postalCode={currentMapId}
                      territoryType={mapElement.type}
                      userAccessLevel={userAccessLevel}
                      handleUnitStatusUpdate={(event) => {
                        const { floor, unitno, addressid } =
                          event.currentTarget.dataset;
                        handleUnitUpdate(
                          addressid as string,
                          currentPostalcode,
                          Number(floor),
                          mapElement.floors,
                          unitno as string,
                          maxUnitNumberLength,
                          currentMapName,
                          mapElement,
                          options,
                          userAccessLevel as number
                        );
                      }}
                      adminUnitHeaderStyle={`${
                        isAdmin ? "admin-unit-header " : ""
                      }`}
                      handleUnitNoUpdate={(event) => {
                        const { sequence, unitno, length } =
                          event.currentTarget.dataset;
                        if (!isAdmin) return;
                        ModalManager.show(UpdateUnit, {
                          mapId: currentMapId,
                          name: currentMapName,
                          unitNo: unitno || "",
                          unitLength: Number(length),
                          unitSequence:
                            sequence === undefined
                              ? undefined
                              : Number(sequence),
                          unitDisplay: ZeroPad(
                            unitno || "",
                            maxUnitNumberLength
                          ),
                          addressData: mapElement,
                          congregation: congregationId
                        });
                      }}
                      handleFloorDelete={(event) => {
                        const { floor } = event.currentTarget.dataset;
                        const hasOnlyOneFloor = mapElement.floors.length === 1;
                        if (hasOnlyOneFloor) {
                          alert(`Territory requires at least 1 floor.`);
                          return;
                        }
                        confirmAlert({
                          customUI: ({ onClose }) => {
                            return (
                              <Container>
                                <Card bg="warning" className="text-center">
                                  <Card.Header>
                                    Warning ⚠️
                                    <HelpButton
                                      link={
                                        WIKI_CATEGORIES.DELETE_ADDRESS_FLOOR
                                      }
                                      isWarningButton={true}
                                    />
                                  </Card.Header>
                                  <Card.Body>
                                    <Card.Title>Are You Very Sure ?</Card.Title>
                                    <Card.Text>
                                      This action will delete floor {`${floor}`}{" "}
                                      of {currentMapId}.
                                    </Card.Text>
                                    <Button
                                      className="m-1"
                                      variant="primary"
                                      onClick={() => {
                                        deleteBlockFloor(
                                          congregationId,
                                          currentMapId,
                                          Number(floor)
                                        );
                                        onClose();
                                      }}
                                    >
                                      Yes, Delete It.
                                    </Button>
                                    <Button
                                      className="no-confirm-btn"
                                      variant="primary"
                                      onClick={() => {
                                        onClose();
                                      }}
                                    >
                                      No
                                    </Button>
                                  </Card.Body>
                                </Card>
                              </Container>
                            );
                          }
                        });
                      }}
                    ></AdminTable>
                  </Card.Body> */}
                {/* </Collapse> */}
              </Card>
            );
          })}
        </Stack>
      </Box>
      {/* 
      <Navbar expand="lg" data-bs-theme="light">
        <Container fluid>
          <NavBarBranding naming={name} />
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Offcanvas placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>{name}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                {congregationTerritoryList &&
                  congregationTerritoryList.length > 0 && (
                    <NavDropdown
                      title={
                        selectedTerritoryCode
                          ? selectedTerritoryCode
                          : "Select Territory"
                      }
                      id={`offcanvasNavbarDropdown-expand`}
                    >
                      {congregationTerritoryList.map((territory) => (
                        <NavDropdown.Item
                          key={territory.id}
                          onClick={() =>
                            processTerritory(territory.id as string)
                          }
                        >
                          {territory.code} - {territory.name}
                        </NavDropdown.Item>
                      ))}
                    </NavDropdown>
                  )}
                {!selectedTerritoryCode && (
                  <ComponentAuthorizer
                    requiredPermission={
                      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                    }
                    userPermission={userAccessLevel}
                  >
                    <Nav.Link
                      onClick={() =>
                        ModalManager.show(NewTerritoryCode, {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId
                        })
                      }
                    >
                      Create Territory
                    </Nav.Link>
                  </ComponentAuthorizer>
                )}
                {selectedTerritoryCode && (
                  <ComponentAuthorizer
                    requiredPermission={
                      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                    }
                    userPermission={userAccessLevel}
                  >
                    <NavDropdown
                      // className="dropdown-btn"
                      // variant="outline-primary"
                      // size="sm"
                      title="Territory"
                    >
                      <NavDropdown.Item
                        onClick={() =>
                          ModalManager.show(NewTerritoryCode, {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId
                          })
                        }
                      >
                        Create New
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() =>
                          ModalManager.show(ChangeTerritoryCode, {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryCode: selectedTerritoryCode,
                            territoryId: selectedTerritoryId
                          })
                        }
                      >
                        Change Code
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() =>
                          confirmAlert({
                            customUI: ({ onClose }) => {
                              return (
                                <Container>
                                  <Card bg="warning" className="text-center">
                                    <Card.Header>
                                      Warning ⚠️
                                      <HelpButton
                                        link={
                                          WIKI_CATEGORIES.DELETE_TERRITORIES
                                        }
                                        isWarningButton={true}
                                      />
                                    </Card.Header>
                                    <Card.Body>
                                      <Card.Title>
                                        Are You Very Sure ?
                                      </Card.Title>
                                      <Card.Text>
                                        This action will delete the territory,{" "}
                                        {selectedTerritoryCode} -{" "}
                                        {selectedTerritoryName} and all its
                                        addresses.
                                      </Card.Text>
                                      <Button
                                        className="m-1"
                                        variant="primary"
                                        onClick={() => {
                                          deleteTerritory(
                                            congregationId,
                                            selectedTerritoryId as string
                                          );
                                          refreshState([
                                            LISTENER_TYPES.MAP,
                                            LISTENER_TYPES.ADDRESS
                                          ]);
                                          onClose();
                                        }}
                                      >
                                        Yes, Delete It.
                                      </Button>
                                      <Button
                                        className="no-confirm-btn"
                                        variant="primary"
                                        onClick={() => {
                                          onClose();
                                        }}
                                      >
                                        No
                                      </Button>
                                    </Card.Body>
                                  </Card>
                                </Container>
                              );
                            }
                          })
                        }
                      >
                        Delete Current
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() =>
                          ModalManager.show(ChangeTerritoryName, {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryId: selectedTerritoryId,
                            name: selectedTerritoryName
                          })
                        }
                      >
                        Edit Current Name
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() =>
                          confirmAlert({
                            customUI: ({ onClose }) => {
                              return (
                                <Container>
                                  <Card bg="warning" className="text-center">
                                    <Card.Header>
                                      Warning ⚠️
                                      <HelpButton
                                        link={WIKI_CATEGORIES.RESET_TERRITORIES}
                                        isWarningButton={true}
                                      />
                                    </Card.Header>
                                    <Card.Body>
                                      <Card.Title>
                                        Are You Very Sure ?
                                      </Card.Title>
                                      <Card.Text>
                                        <p>
                                          This action will reset the status of
                                          all addresses in the territory,{" "}
                                          {selectedTerritoryCode} -{" "}
                                          {selectedTerritoryName}.
                                        </p>
                                        <p>
                                          Certain statuses such as DNC and
                                          Invalid will not be affected.
                                        </p>
                                      </Card.Text>
                                      <Button
                                        className="m-1"
                                        variant="primary"
                                        onClick={() => {
                                          ResetAddresses(
                                            congregationId,
                                            "",
                                            selectedTerritoryId as string
                                          );
                                          onClose();
                                        }}
                                      >
                                        Yes, Reset them.
                                      </Button>
                                      <Button
                                        className="no-confirm-btn"
                                        variant="primary"
                                        onClick={() => {
                                          onClose();
                                        }}
                                      >
                                        No
                                      </Button>
                                    </Card.Body>
                                  </Card>
                                </Container>
                              );
                            }
                          })
                        }
                      >
                        Reset status
                      </NavDropdown.Item>
                    </NavDropdown>
                  </ComponentAuthorizer>
                )}
                {selectedTerritoryCode && (
                  <ComponentAuthorizer
                    requiredPermission={
                      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                    }
                    userPermission={userAccessLevel}
                  >
                    <NavDropdown
                      // className="dropdown-btn"
                      // variant="outline-primary"
                      // size="sm"
                      title="Address"
                      align="end"
                    >
                      <NavDropdown.Item
                        onClick={() =>
                          ModalManager.show(NewPublicAddress, {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryId: selectedTerritoryId,
                            defaultType: policy.defaultType
                          }).then(
                            async () =>
                              await refreshCongregationTerritory(
                                selectedTerritoryId || ""
                              )
                          )
                        }
                      >
                        Public
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() =>
                          ModalManager.show(NewPrivateAddress, {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryId: selectedTerritoryId,
                            defaultType: policy.defaultType
                          }).then(
                            async () =>
                              await refreshCongregationTerritory(
                                selectedTerritoryId as string
                              )
                          )
                        }
                      >
                        Private
                      </NavDropdown.Item>
                    </NavDropdown>
                  </ComponentAuthorizer>
                )}
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={userAccessLevel}
                >
                  <NavDropdown
                    // className="dropdown-btn"
                    // size="sm"
                    // variant="outline-primary"
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
                    <NavDropdown.Item
                      onClick={() =>
                        ModalManager.show(UpdateCongregationSettings, {
                          currentName: name,
                          currentCongregation: congregationId,
                          currentMaxTries:
                            policy?.maxTries || DEFAULT_CONGREGATION_MAX_TRIES,
                          currentDefaultExpiryHrs: defaultExpiryHours,
                          currentIsMultipleSelection: policy?.isMultiselect
                        })
                      }
                    >
                      Settings
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      onClick={() =>
                        ModalManager.show(UpdateCongregationOptions, {
                          currentCongregation: congregationId
                        })
                      }
                    >
                      Household Options
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={async () => await getUsers()}>
                      Manage Users
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      onClick={() => {
                        ModalManager.show(InviteUser, {
                          email: user.email,
                          congregation: congregationId,
                          footerSaveAcl: userAccessLevel
                        });
                      }}
                    >
                      Invite User
                    </NavDropdown.Item>
                  </NavDropdown>
                </ComponentAuthorizer>
                {congregations.length > 1 && (
                  <NavDropdown
                    // className="dropdown-btn"
                    // size="sm"
                    // variant="outline-primary"
                    title={
                      <>
                        {congregationId &&
                          congregations.find(
                            (cong) => cong.id === congregationId
                          )?.congregation.name}{" "}
                      </>
                    }
                    align={{ lg: "end" }}
                  >
                    {congregations.map((cong) => (
                      <NavDropdown.Item
                        key={`congregation-${cong.id}`}
                        onClick={() => {
                          prepareAdmin(cong);
                        }}
                      >
                        {cong.congregation.name}
                      </NavDropdown.Item>
                    ))}
                  </NavDropdown>
                )}
                <NavDropdown
                  // className="dropdown-btn"
                  // size="sm"
                  // variant="outline-primary"
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
                  <NavDropdown.Item
                    onClick={() => {
                      ModalManager.show(GetProfile, {
                        user: user
                      });
                    }}
                  >
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    onClick={async () => {
                      setIsAssignmentLoading(true);
                      const linkListing = await getLinks(
                        congregationId,
                        user.uid
                      );
                      setIsAssignmentLoading(false);
                      if (!linkListing || linkListing.length === 0) {
                        alert("No assignments found.");
                        return;
                      }
                      ModalManager.show(GetAssignments, {
                        assignments: linkListing,
                        congregation: congregationId
                      });
                    }}
                  >
                    Assignments
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    onClick={() =>
                      ModalManager.show(ChangePassword, {
                        user: user,
                        userAccessLevel: userAccessLevel
                      })
                    }
                  >
                    Change Password
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={logoutUser}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
          {/* <Navbar.Collapse
              id="basic-navbar-nav"
              className="justify-content-end mt-1"
            >
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
                          isDataFetched={true}
                          aggregate={territoryAddressData.aggregate}
                        />
                        {selectedTerritoryCode}
                      </>
                    ) : (
                      "Select Territory"
                    )}
                  </Button>
                )}
              {!selectedTerritoryCode && (
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={userAccessLevel}
                >
                  <Button
                    className="m-1"
                    size="sm"
                    variant="outline-primary"
                    onClick={() =>
                      ModalManager.show((NewTerritoryCode), {
                        footerSaveAcl: userAccessLevel,
                        congregation: congregationId
                      })
                    }
                  >
                    Create Territory
                  </Button>
                </ComponentAuthorizer>
              )}
              {selectedTerritoryCode && (
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={userAccessLevel}
                >
                  <DropdownButton
                    className="dropdown-btn"
                    variant="outline-primary"
                    size="sm"
                    title="Territory"
                  >
                    <Dropdown.Item
                      onClick={() =>
                        ModalManager.show((NewTerritoryCode), {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId
                        })
                      }
                    >
                      Create New
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        ModalManager.show(
                          (ChangeTerritoryCode),
                          {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryCode: selectedTerritoryCode,
                            territoryId: selectedTerritoryId
                          }
                        )
                      }
                    >
                      Change Code
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        confirmAlert({
                          customUI: ({ onClose }) => {
                            return (
                              <Container>
                                <Card bg="warning" className="text-center">
                                  <Card.Header>
                                    Warning ⚠️
                                    <HelpButton
                                      link={WIKI_CATEGORIES.DELETE_TERRITORIES}
                                      isWarningButton={true}
                                    />
                                  </Card.Header>
                                  <Card.Body>
                                    <Card.Title>Are You Very Sure ?</Card.Title>
                                    <Card.Text>
                                      This action will delete the territory,{" "}
                                      {selectedTerritoryCode} -{" "}
                                      {selectedTerritoryName} and all its
                                      addresses.
                                    </Card.Text>
                                    <Button
                                      className="m-1"
                                      variant="primary"
                                      onClick={() => {
                                        deleteTerritory(
                                          congregationId,
                                          selectedTerritoryId as string
                                        );
                                        refreshState([
                                          LISTENER_TYPES.MAP,
                                          LISTENER_TYPES.ADDRESS
                                        ]);
                                        onClose();
                                      }}
                                    >
                                      Yes, Delete It.
                                    </Button>
                                    <Button
                                      className="no-confirm-btn"
                                      variant="primary"
                                      onClick={() => {
                                        onClose();
                                      }}
                                    >
                                      No
                                    </Button>
                                  </Card.Body>
                                </Card>
                              </Container>
                            );
                          }
                        })
                      }
                    >
                      Delete Current
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        ModalManager.show(
                          (ChangeTerritoryName),
                          {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryId: selectedTerritoryId,
                            name: selectedTerritoryName
                          }
                        )
                      }
                    >
                      Edit Current Name
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        confirmAlert({
                          customUI: ({ onClose }) => {
                            return (
                              <Container>
                                <Card bg="warning" className="text-center">
                                  <Card.Header>
                                    Warning ⚠️
                                    <HelpButton
                                      link={WIKI_CATEGORIES.RESET_TERRITORIES}
                                      isWarningButton={true}
                                    />
                                  </Card.Header>
                                  <Card.Body>
                                    <Card.Title>Are You Very Sure ?</Card.Title>
                                    <Card.Text>
                                      <p>
                                        This action will reset the status of all
                                        addresses in the territory,{" "}
                                        {selectedTerritoryCode} -{" "}
                                        {selectedTerritoryName}.
                                      </p>
                                      <p>
                                        Certain statuses such as DNC and Invalid
                                        will not be affected.
                                      </p>
                                    </Card.Text>
                                    <Button
                                      className="m-1"
                                      variant="primary"
                                      onClick={() => {
                                        ResetAddresses(
                                          congregationId,
                                          "",
                                          selectedTerritoryId as string
                                        );
                                        onClose();
                                      }}
                                    >
                                      Yes, Reset them.
                                    </Button>
                                    <Button
                                      className="no-confirm-btn"
                                      variant="primary"
                                      onClick={() => {
                                        onClose();
                                      }}
                                    >
                                      No
                                    </Button>
                                  </Card.Body>
                                </Card>
                              </Container>
                            );
                          }
                        })
                      }
                    >
                      Reset status
                    </Dropdown.Item>
                  </DropdownButton>
                </ComponentAuthorizer>
              )}
              {selectedTerritoryCode && (
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={userAccessLevel}
                >
                  <DropdownButton
                    className="dropdown-btn"
                    variant="outline-primary"
                    size="sm"
                    title="New Address"
                    align="end"
                  >
                    <Dropdown.Item
                      onClick={() =>
                        //                     footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
                        // congregation,
                        // defaultType,
                        // mapId,
                        // territoryId
                        ModalManager.show((NewPublicAddress), {
                          footerSaveAcl: userAccessLevel,
                          congregation: congregationId,
                          territoryId: selectedTerritoryId,
                          defaultType: policy.defaultType
                        }).then(
                          async () =>
                            await refreshCongregationTerritory(
                              selectedTerritoryId || ""
                            )
                        )
                      }
                    >
                      Public
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        ModalManager.show(
                          (NewPrivateAddress),
                          {
                            footerSaveAcl: userAccessLevel,
                            congregation: congregationId,
                            territoryId: selectedTerritoryId,
                            defaultType: policy.defaultType
                          }
                        ).then(
                          async () =>
                            await refreshCongregationTerritory(
                              selectedTerritoryId as string
                            )
                        )
                      }
                    >
                      Private
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
                        (UpdateCongregationSettings),
                        {
                          currentName: name,
                          currentCongregation: congregationId,
                          currentMaxTries:
                            policy?.maxTries || DEFAULT_CONGREGATION_MAX_TRIES,
                          currentDefaultExpiryHrs: defaultExpiryHours,
                          currentIsMultipleSelection: policy?.isMultiselect
                        }
                      )
                    }
                  >
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() =>
                      ModalManager.show(
                        (UpdateCongregationOptions),
                        {
                          currentCongregation: congregationId
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
                      ModalManager.show((InviteUser), {
                        email: user.email,
                        congregation: congregationId,
                        footerSaveAcl: userAccessLevel
                      });
                    }}
                  >
                    Invite User
                  </Dropdown.Item>
                </DropdownButton>
              </ComponentAuthorizer>
              {congregations.length > 1 && (
                <DropdownButton
                  className="dropdown-btn"
                  size="sm"
                  variant="outline-primary"
                  title={
                    <>
                      {congregationId &&
                        congregations.find((cong) => cong.id === congregationId)
                          ?.congregation.name}{" "}
                    </>
                  }
                  align={{ lg: "end" }}
                >
                  {congregations.map((cong) => (
                    <Dropdown.Item
                      key={`congregation-${cong.id}`}
                      onClick={() => {
                        prepareAdmin(cong);
                      }}
                    >
                      {cong.congregation.name}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              )}
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
                    ModalManager.show((GetProfile), {
                      user: user
                    });
                  }}
                >
                  Profile
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={async () => {
                    setIsAssignmentLoading(true);
                    const linkListing = await getLinks(
                      congregationId,
                      user.uid
                    );
                    setIsAssignmentLoading(false);
                    if (!linkListing || linkListing.length === 0) {
                      alert("No assignments found.");
                      return;
                    }
                    ModalManager.show((GetAssignments), {
                      assignments: linkListing,
                      congregation: congregationId
                    });
                  }}
                >
                  Assignments
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    ModalManager.show((ChangePassword), {
                      user: user,
                      userAccessLevel: userAccessLevel
                    })
                  }
                >
                  Change Password
                </Dropdown.Item>
                <Dropdown.Item onClick={logoutUser}>Logout</Dropdown.Item>
              </DropdownButton>
            </Navbar.Collapse> 
        </Container>
      </Navbar>
      */}
      {/* {!selectedTerritoryCode && <Welcome name={`${user.displayName}`} />} */}
      {/* <TerritoryHeader name={selectedTerritoryName} /> */}
      {/* There is no need to open all accordion for read-only users. */}

      <BackToTopButton showButton={showBkTopButton} />
    </Box>
  );
}

export default Admin;
