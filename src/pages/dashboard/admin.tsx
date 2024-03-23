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
import { auth, firestore } from "../../firebase";
import {
  query,
  collection,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  DocumentData
} from "firebase/firestore";
import {
  floorDetails,
  territoryDetails,
  addressDetails,
  adminProps,
  OptionProps,
  unitDetails,
  CongregationProps,
  AlertSnackbarProps
} from "../../utils/interface";
import { useRollbar } from "@rollbar/react";
import { LinkSession, Policy } from "../../utils/policies";
import AdminTable from "../../components/table/admin";
import errorHandler from "../../utils/helpers/errorhandler";
import ZeroPad from "../../utils/helpers/zeropad";
import addHours from "../../utils/helpers/addhours";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import getMaxUnitLength from "../../utils/helpers/maxunitlength";
import processCompletedPercentage from "../../utils/helpers/processcompletedpercent";
import BackToTopButton from "../../components/navigation/backtotop";
import Loader from "../../components/statics/loader";
import deleteBlockFloor from "../../utils/helpers/deletefloors";
import deleteTerritoryAddress from "../../utils/helpers/deleteaddress";
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
  PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY,
  TERRITORY_TYPES,
  DEFAULT_CONGREGATION_MAX_TRIES,
  LISTENER_TYPES
} from "../../utils/constants";
import ModalManager from "@ebay/nice-modal-react";
import getOptions from "../../utils/helpers/getcongoptions";
import SuspenseComponent from "../../components/utils/suspense";
// import {
//   Box,
//   Button,
//   ButtonGroup,
//   Card,
//   CardActions,
//   CardContent,
//   CardOverflow,
//   CircularProgress,
//   Dropdown,
//   IconButton,
//   List,
//   ListDivider,
//   ListItem,
//   ListItemButton,
//   ListItemContent,
//   ListItemDecorator,
//   ListSubheader,
//   Menu,
//   MenuButton,
//   MenuItem,
//   Paper,
//   Stack,
//   Typography,
//   listItemButtonClasses
// } from "@mui/joy";
import { Add, DeleteForever, ExpandLess, MoreVert } from "@mui/icons-material";
import ColorSchemeToggle from "../../components/ColorSchemeToggle";
import { closeSidebar } from "../../components/utils/sidebar";
import SupportRoundedIcon from "@mui/icons-material/SupportRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MapIcon from "@mui/icons-material/Map";
import Toggler from "../../components/Sidebar";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import MenuIcon from "@mui/icons-material/Menu";
import ShareIcon from "@mui/icons-material/Share";
import DirectionsIcon from "@mui/icons-material/Directions";
import AbcIcon from "@mui/icons-material/Abc";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AlertContext } from "../../components/utils/context";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FeedbackIcon from "@mui/icons-material/Feedback";
import {
  AppBar,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  IconButtonProps,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  styled
} from "@mui/material";
import Assignments from "../../components/utils/assignments";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import Directions from "../../components/modal/map";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Gauge, PieChart } from "@mui/x-charts";
const UnauthorizedPage = SuspenseComponent(
  lazy(() => import("../../components/statics/unauth"))
);
const UpdateUnitStatus = SuspenseComponent(
  lazy(() => import("../../components/modal/updatestatus"))
);
const UpdateUnit = SuspenseComponent(
  lazy(() => import("../../components/modal/updateunit"))
);
const ConfirmSlipDetails = SuspenseComponent(
  lazy(() => import("../../components/modal/slipdetails"))
);
const UpdateCongregationSettings = SuspenseComponent(
  lazy(() => import("../../components/modal/congsettings"))
);
const CongregationUsers = SuspenseComponent(
  lazy(() => import("../../components/modal/congusers"))
);
const UpdateCongregationOptions = SuspenseComponent(
  lazy(() => import("../../components/modal/congoptions"))
);
const UpdateAddressInstructions = SuspenseComponent(
  lazy(() => import("../../components/modal/instructions"))
);
const UpdateAddressFeedback = SuspenseComponent(
  lazy(() => import("../../components/modal/updateaddfeedback"))
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
const GetProfile = SuspenseComponent(
  lazy(() => import("../../components/modal/profile"))
);
const Support = SuspenseComponent(
  lazy(() => import("../../components/modal/support"))
);
const ChangeTerritoryName = SuspenseComponent(
  lazy(() => import("../../components/modal/changeterritoryname"))
);
const ChangeTerritoryCode = SuspenseComponent(
  lazy(() => import("../../components/modal/changeterritorycd"))
);
const ChangePassword = SuspenseComponent(
  lazy(() => import("../../components/modal/changepassword"))
);
const ChangeMapLocation = SuspenseComponent(
  lazy(() => import("../../components/modal/changelocation"))
);
const ChangeAddressName = SuspenseComponent(
  lazy(() => import("../../components/modal/changeaddname"))
);
const ChangeMapTerritory = SuspenseComponent(
  lazy(() => import("../../components/modal/changeterritory"))
);

const ConfirmationDialog = SuspenseComponent(
  lazy(() => import("../../components/modal/confirmation"))
);

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest
  })
}));

function Admin({ user }: adminProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorised, setIsUnauthorised] = useState<boolean>(false);
  const [showBkTopButton, setShowBkTopButton] = useState(false);
  const [name, setName] = useState<string>("");
  const [territories, setTerritories] = useState(
    new Map<string, territoryDetails>()
  );
  const [assignmentLinks, setAssignmentLinksData] = useState(
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const handleDrawerClose = () => {
    console.log("Closing drawer");
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    console.log("Drawer transition ended");
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    console.log("Toggling drawer");
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    } else {
      console.log("Cannot toggle drawer because it is closing");
    }
  };
  const handleResize = () => {
    const currentWindowWidth = window.innerWidth;
    setWindowWidth(currentWindowWidth);
  };
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
    }
    if (listenerTypes.includes(LISTENER_TYPES.TERRITORY)) {
      setTerritories(new Map<string, territoryDetails>());
    }
    if (listenerTypes.includes(LISTENER_TYPES.CONGREGATION)) {
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
          const newAddresses = new Map();
          snapshot.forEach((map) => {
            const mapData = map.data();
            const mapid = map.id;
            const postalCode = mapData.postal_code;
            const mapname = mapData.name;
            const location = mapData.location;

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
              nothome: mapData.progress?.not_home || 0,
              location: location
            };
            territoryAddresses.set(mapid, addressData);
            newAddresses.set(mapid, addressData);
          });
          setAddressData(newAddresses);
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
          snapshot.forEach((doc) => {
            const linkData = doc.data();
            const linkId = doc.id;
            const linkType = linkData.type;
            const linkExpiry = linkData.end_date;
            const linkMap = linkData.map;
            const linkName = linkData.name;
            const linkAssignee = linkData.user;
            console.log(`linkData: ${JSON.stringify(linkData)}, ${linkId}`);

            const link = new LinkSession({ ...linkData }, linkId);
            console.log(linkType, linkMap, linkName, linkAssignee, linkExpiry);
            const assignmentLinks = assignmentLinksData.get(linkMap) || [];
            assignmentLinks.push(link);
            assignmentLinksData.set(linkMap, assignmentLinks);
          });
          setAssignmentLinksData(assignmentLinksData);
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
    lowestFloor: number,
    highestFloor: number,
    lowestSequence: number,
    highestSequence: number,
    publisherName = ""
  ) => {
    const link = new LinkSession();
    link.end_date = addHours(hours);
    link.map = mapId;
    link.territory = territoryId;
    link.type = linktype;
    link.max_tries = policy.maxTries;
    link.user = user.uid;
    link.congregation = congregationId;
    link.name = postalName;
    link.publisher_name = publisherName;
    link.lowest_floor = lowestFloor;
    link.highest_floor = highestFloor;
    link.lowest_sequence = lowestSequence;
    link.highest_sequence = highestSequence;
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
    publisherName: string,
    lowestFloor: number,
    highestFloor: number,
    lowestSequence: number,
    highestSequence: number
  ) => {
    if (!map || !name || !linkid || !publisherName) return;
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
        lowestFloor,
        highestFloor,
        lowestSequence,
        highestSequence,
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
    lowestFloor: number,
    highestFloor: number,
    lowestSequence: number,
    highestSequence: number,
    publisherName = ""
  ) => {
    if (!navigator.share) {
      alert(UNSUPPORTED_BROWSER_MSG);
      return;
    }
    try {
      await setTimedLink(
        linktype,
        mapid,
        territoryId,
        mapname,
        linkId,
        hours,
        lowestFloor,
        highestFloor,
        lowestSequence,
        highestSequence,
        publisherName
      );
      const linkUrl = new URL(url, window.location.href);
      await navigator.share({
        title: title,
        text: body,
        url: linkUrl.toString()
      });
    } catch (error) {
      errorHandler(error, rollbar, false);
    }
  };

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
    const userData = await getDoc(doc(firestore, `users/${user.uid}`));

    if (!userData.exists()) {
      setIsUnauthorised(true);
      setIsLoading(false);
      return;
    }

    const congAcl = userData.data()?.access;

    const congregations = [] as Array<CongregationProps>;

    for (const key in congAcl) {
      const congregationDocument = await getDoc(
        doc(firestore, `congregations/${key}`)
      );
      const congregation = congregationDocument.data();
      if (congregation) {
        const acl = congAcl[key];
        congregations.push({ id: key, congregation, acl });
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
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [user]);

  const territoryAddressData = useMemo(
    () => getTerritoryAddressData(addressData),
    [addressData]
  );

  const drawer = (
    <div>
      <Toolbar>
        <IconButton disabled>
          <img src="favicon-32x32.png" alt="Ministry Mapper Icon" />
        </IconButton>
        <Typography variant="subtitle1">{name}</Typography>
      </Toolbar>
      <Divider />
      <List
        sx={{
          gap: 1
        }}
        component="nav"
      >
        {congregations.length > 1 && (
          <Toggler
            renderToggle={({ open, setOpen }) => (
              <ListItemButton onClick={() => setOpen(!open)}>
                <ListItemIcon>
                  <HomeWorkIcon />
                </ListItemIcon>
                <ListItemText primary="Congregations" />
                {open ? <ExpandLess /> : <ExpandMoreIcon />}
              </ListItemButton>
            )}
          >
            <List sx={{ gap: 0.5 }} component="div" disablePadding>
              {congregations.map((congregation) => (
                <ListItemButton
                  key={congregation.id}
                  selected={congregation.id === congregationId}
                  onClick={() => prepareAdmin(congregation)}
                >
                  {congregation.congregation.name}
                </ListItemButton>
              ))}
            </List>
          </Toggler>
        )}
        {congregationTerritoryList.length > 0 && (
          <Toggler
            renderToggle={({ open, setOpen }) => (
              <ListItemButton onClick={() => setOpen(!open)}>
                <ListItemIcon>
                  <MapIcon />
                </ListItemIcon>
                <ListItemText primary="Territories" />
                {open ? <ExpandLess /> : <ExpandMoreIcon />}
              </ListItemButton>
            )}
          >
            <List component="div">
              {congregationTerritoryList.map((territory) => (
                <ListItem key={territory.id} sx={{ pl: 4 }}>
                  <ListItemButton
                    selected={territory.id === selectedTerritoryId}
                    onClick={() => {
                      processTerritory(territory.id as string);
                      closeSidebar();
                    }}
                  >
                    <ListItemText primary={territory.code} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Toggler>
        )}
        <Toggler
          renderToggle={({ open, setOpen }) => (
            <ListItemButton onClick={() => setOpen(!open)}>
              <ListItemIcon>
                <SettingsRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Manage" />
              {open ? <ExpandLess /> : <ExpandMoreIcon />}
            </ListItemButton>
          )}
        >
          <List sx={{ pl: 3 }} component="div">
            <ListSubheader>Congregation</ListSubheader>
            <ListItem>
              <ListItemButton
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
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton
                onClick={() => {
                  ModalManager.show(CongregationUsers, {
                    congregation: congregationId
                  });
                }}
              >
                <ListItemText primary="Users" />
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton
                onClick={() => {
                  ModalManager.show(UpdateCongregationOptions, {
                    currentCongregation: congregationId
                  });
                }}
              >
                <ListItemText primary="Options" />
              </ListItemButton>
            </ListItem>
            <ListSubheader>Territory</ListSubheader>
            <ListItem>
              <ListItemButton
                onClick={() =>
                  ModalManager.show(NewTerritoryCode, {
                    footerSaveAcl: userAccessLevel,
                    congregation: congregationId
                  })
                }
              >
                <ListItemText primary="New" />
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
                <ListItemText primary="Change Code" />
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
                    refreshState([LISTENER_TYPES.MAP, LISTENER_TYPES.ADDRESS]);
                  })
                }
              >
                <ListItemText primary="Delete" />
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
                <ListItemText primary="Change Name" />
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
              >
                <ListItemText primary="Reset" />
              </ListItemButton>
            </ListItem>
            <ListSubheader about="test">Map</ListSubheader>
            <ListItem>
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
                <ListItemText primary="New Public" />
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
                <ListItemText primary="New Private" />
              </ListItemButton>
            </ListItem>
          </List>
        </Toggler>
        <Toggler
          renderToggle={({ open, setOpen }) => (
            <ListItemButton onClick={() => setOpen(!open)}>
              <ListItemIcon>
                <ManageAccountsIcon />
              </ListItemIcon>
              <ListItemText primary="Account" />
              {open ? <ExpandLess /> : <ExpandMoreIcon />}
            </ListItemButton>
          )}
        >
          <List>
            <ListItem>
              <ListItemButton
                onClick={() =>
                  ModalManager.show(GetProfile, {
                    user: user
                  })
                }
              >
                <ListItemText primary="Profile" />
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
                <ListItemText primary="Change Password" />
              </ListItemButton>
            </ListItem>
          </List>
        </Toggler>
      </List>
      <ListItem>
        <ListItemButton onClick={() => ModalManager.show(Support, {})}>
          <ListItemIcon>
            <SupportRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="Support" />
        </ListItemButton>
      </ListItem>
    </div>
  );

  if (isLoading) return <Loader />;
  if (isUnauthorised)
    return (
      <UnauthorizedPage handleClick={logoutUser} name={`${user.displayName}`} />
    );
  const isAdmin = userAccessLevel === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar component="nav" color="default">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: "flex", md: "flex" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 3,
              flexGrow: 1,
              justifyContent: "flex-end"
            }}
          >
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
                  <Typography variant="subtitle2">
                    {user.displayName}
                  </Typography>
                  <Typography variant="body2">{user.email}</Typography>
                </Box>
                <IconButton size="small" onClick={() => logoutUser()}>
                  <LogoutRoundedIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          width: { sm: "var(--Sidebar-width)" },
          flexShrink: { sm: 0 },
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
            md: "none"
          },
          transition: "transform 0.4s, width 0.4s",
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Drawer
          variant={windowWidth <= 600 ? "temporary" : "permanent"}
          open={mobileOpen}
          color="default"
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true // Better open performance on mobile.
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: "var(--Sidebar-width)"
            }
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "56px",
          width: { sm: `calc(100% - var(--Sidebar-width))` },
          overflow: "auto"
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
            const mapAssignments = assignmentLinks.get(currentMapId);

            return (
              <Card key={`card-${currentMapId}`}>
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
                    <Typography variant="h6">{currentMapName}</Typography>
                    <PopupState
                      variant="popover"
                      popupId={`popupId-${currentMapId}`}
                      key={`popupState-${currentMapId}`}
                    >
                      {(popupState) => (
                        <>
                          <IconButton
                            size="small"
                            sx={{ borderRadius: "50%" }}
                            {...bindTrigger(popupState)}
                          >
                            <MoreVert />
                          </IconButton>
                          <Menu
                            sx={{
                              // display: { xs: "none", sm: "flex" },
                              borderRadius: "50%"
                            }}
                            {...bindMenu(popupState)}
                          >
                            <MenuItem
                              onClick={() =>
                                ModalManager.show(ChangeMapLocation, {
                                  footerSaveAcl: userAccessLevel,
                                  congregation: congregationId,
                                  location: mapElement.location,
                                  name: currentMapName,
                                  mapId: currentMapId
                                })
                              }
                            >
                              <ListItemIcon>
                                <EditLocationAltIcon />
                              </ListItemIcon>{" "}
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
                              <ListItemIcon>
                                <AbcIcon />
                              </ListItemIcon>
                              Change Name
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                ModalManager.show(ChangeMapTerritory, {
                                  // footerSaveAcl: userAccessLevel,
                                  congregation: congregationId,
                                  // postalCode: currentPostalcode,
                                  mapId: currentMapId,
                                  territories: congregationTerritoryList,
                                  territoryId: selectedTerritoryId
                                })
                              }
                            >
                              <ListItemIcon>
                                <DirectionsIcon />
                              </ListItemIcon>{" "}
                              Change Territory
                            </MenuItem>
                            <Divider />
                            <MenuItem
                              onClick={() =>
                                ModalManager.show(UpdateAddressFeedback, {
                                  mapId: currentMapId,
                                  footerSaveAcl: userAccessLevel,
                                  name: currentMapName,
                                  congregation: congregationId,
                                  postalCode: currentPostalcode,
                                  currentFeedback: mapElement.feedback,
                                  currentName: user.displayName as string
                                })
                              }
                            >
                              <ListItemIcon>
                                <FeedbackIcon />
                              </ListItemIcon>
                              Feedback
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                ModalManager.show(UpdateAddressInstructions, {
                                  congregation: congregationId,
                                  mapId: currentMapId,
                                  userAccessLevel: userAccessLevel,
                                  addressName: currentMapName,
                                  instructions: mapElement.instructions,
                                  userName: user.displayName as string
                                })
                              }
                            >
                              <ListItemIcon>
                                <AssignmentIcon />
                              </ListItemIcon>
                              Instructions
                            </MenuItem>
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
                              <ListItemIcon>
                                <Add />
                              </ListItemIcon>{" "}
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
                                <ListItemIcon>
                                  <ArrowDropUpIcon />
                                </ListItemIcon>{" "}
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
                                <ListItemIcon>
                                  <ArrowDropDownIcon />
                                </ListItemIcon>{" "}
                                Add Lower Floor
                              </MenuItem>
                            )}
                            <Divider />
                            <MenuItem
                              onClick={() =>
                                ModalManager.show(ConfirmationDialog, {
                                  title: "Delete Address",
                                  message: `The action will completely delete, ${currentMapName}.`
                                }).then(() => {
                                  deleteBlock(
                                    currentMapId,
                                    currentMapName,
                                    true
                                  );
                                })
                              }
                            >
                              <ListItemIcon>
                                <DeleteForever />
                              </ListItemIcon>{" "}
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
                              <ListItemIcon>
                                <RestartAltIcon />
                              </ListItemIcon>{" "}
                              Reset
                            </MenuItem>
                          </Menu>
                        </>
                      )}
                    </PopupState>
                  </Stack>
                  <Stack
                    spacing={1}
                    direction="row"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ my: 0.25 }}
                  >
                    <Box sx={{ position: "relative", display: "inline-flex" }}>
                      <Gauge
                        height={120}
                        width={120}
                        value={mapElement.aggregate}
                        innerRadius="70%"
                        outerRadius="100%"
                        text={`${mapElement.aggregate}%`}
                      />
                    </Box>
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-flex"
                      }}
                    >
                      <PieChart
                        width={125}
                        height={125}
                        slotProps={{
                          legend: {
                            hidden: true
                          }
                        }}
                        series={[
                          {
                            cx: 55,
                            innerRadius: 0,
                            outerRadius: 50,
                            data: [
                              {
                                id: 0,
                                value: mapElement.notdone + 50,
                                label: "Not done"
                              },
                              {
                                id: 1,
                                value: mapElement.nothome + 25,
                                label: "Not Home"
                              },
                              {
                                id: 2,
                                value: mapElement.done + 70,
                                label: "Done"
                              }
                            ],
                            arcLabel: (item) => {
                              if (item.value === 0) return "";
                              if (item.label === "Not done") return "🔲";
                              if (item.label === "Not Home") return "🏠";
                              return "✅";
                            },
                            highlightScope: {
                              faded: "global",
                              highlighted: "item"
                            },
                            faded: {
                              innerRadius: 30,
                              additionalRadius: -30,
                              color: "gray"
                            }
                          }
                        ]}
                      />
                    </Box>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    {mapElement.instructions && (
                      <Card variant="outlined" sx={{ flexGrow: 1 }}>
                        <CardHeader
                          avatar={<AssignmentIcon />}
                          title="Instructions"
                          titleTypographyProps={{
                            variant: "subtitle1"
                          }}
                        />
                        <CardContent>
                          <Typography variant="body1">
                            {mapElement.instructions}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    {mapElement.feedback && (
                      <Card variant="outlined" sx={{ flexGrow: 1 }}>
                        <CardHeader
                          avatar={<FeedbackIcon />}
                          title="Feedback"
                          titleTypographyProps={{
                            variant: "subtitle1"
                          }}
                        />
                        <CardContent>
                          <Typography variant="body1">
                            {mapElement.feedback}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Stack>
                  {mapAssignments && (
                    <Box
                      sx={{
                        mt: 1
                      }}
                    >
                      <Card>
                        <CardHeader
                          avatar={<AssignmentIcon />}
                          title="Assignments"
                          titleTypographyProps={{
                            variant: "subtitle1"
                          }}
                        />
                        <CardContent>
                          <Assignments
                            linkSessions={mapAssignments}
                            linkId={addressLinkId}
                          />
                        </CardContent>
                      </Card>
                    </Box>
                  )}
                  <CardActions disableSpacing>
                    <IconButton
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
                          type: mapElement.type,
                          maxSequence: 30,
                          maxFloor: 10
                        }).then((linkReturn) => {
                          const linkObject = linkReturn as Record<
                            string,
                            unknown
                          >;
                          console.log(`linkObject`, linkObject);
                          handleSubmitPersonalSlip(
                            currentMapId,
                            selectedTerritoryId as string,
                            currentMapName,
                            addressLinkId,
                            linkObject.linkExpiryHrs as number,
                            linkObject.publisherName as string,
                            linkObject.lowestFloor as number,
                            linkObject.highestFloor as number,
                            linkObject.lowestSequence as number,
                            linkObject.highestSequence as number
                          );
                        });
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                    <IconButton
                      // size="small"
                      // startIcon={<DirectionsIcon />}
                      onClick={() => {
                        // window.open(
                        //   GetDirection(currentPostalcode),
                        //   "_blank"
                        // );
                        ModalManager.show(Directions, {});
                      }}
                    >
                      <DirectionsIcon />
                    </IconButton>
                    <ExpandMore
                      expand={mapDisplay.get(currentMapId) || false}
                      onClick={() =>
                        configureMapListener(
                          currentMapId,
                          selectedTerritoryId as string,
                          congregationId as string
                        )
                      }
                    >
                      <ExpandMoreIcon />
                    </ExpandMore>
                  </CardActions>
                  {/* <Stack direction="row">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        bgcolor: "neutral.softBg"
                      }}
                    ></Box>
                    <Box
                      sx={{
                        flexGrow: 1,
                        textAlign: "right",
                        bgcolor: "neutral.softBg"
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<PageviewIcon />}
                        onClick={() => {
                          configureMapListener(
                            currentMapId,
                            selectedTerritoryId as string,
                            congregationId as string
                          );
                        }}
                      >
                        {mapDisplay.get(currentMapId) ? " Close" : " View"}
                      </Button>
                    </Box>
                  </Stack> */}
                  <Collapse
                    in={mapDisplay.get(currentMapId)}
                    timeout="auto"
                    unmountOnExit
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
                    />
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>
      <BackToTopButton showButton={showBkTopButton} />
    </Box>
  );
}

export default Admin;
