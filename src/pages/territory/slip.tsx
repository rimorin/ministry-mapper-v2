import { useEffect, useState, useMemo } from "react";
import { firestore } from "../../firebase";
import {
  OptionProps,
  floorDetails,
  unitDetails,
  valuesDetails
} from "../../utils/interface";
import PublisherTerritoryTable from "../../components/table/publisher";
import { Policy } from "../../utils/policies";
import ZeroPad from "../../utils/helpers/zeropad";
import getMaxUnitLength from "../../utils/helpers/maxunitlength";
import getCompletedPercent from "../../utils/helpers/getcompletedpercent";
import getOptions from "../../utils/helpers/getcongoptions";
import Loader from "../../components/statics/loader";
import {
  DEFAULT_FLOOR_PADDING,
  TERRITORY_TYPES,
  USER_ACCESS_LEVELS,
  WIKI_CATEGORIES
} from "../../utils/constants";
import "../../css/slip.css";
import Countdown from "react-countdown";

import MenuIcon from "@mui/icons-material/Menu";
import ModalManager from "@ebay/nice-modal-react";
import UpdateAddressFeedback from "../../components/modal/updateaddfeedback";
import UpdateUnitStatus from "../../components/modal/updatestatus";
import GetDirection from "../../utils/helpers/directiongenerator";
import DirectionsIcon from "@mui/icons-material/Directions";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimerIcon from "@mui/icons-material/Timer";
import FeedbackIcon from "@mui/icons-material/Feedback";
import {
  onSnapshot,
  collection,
  where,
  orderBy,
  query,
  doc
} from "firebase/firestore";
import {
  Badge,
  Box,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Sheet,
  Typography,
  listItemButtonClasses
} from "@mui/joy";
import ColorSchemeToggle from "../../components/ColorSchemeToggle";
import { toggleSidebar, closeSidebar } from "../../components/utils/sidebar";
const Slip = ({
  tokenEndtime = 0,
  mapId = "",
  congregationcode = "",
  maxTries = 0,
  pubName = "",
  floorFilter = [-10, 100],
  seqFilter = [0, 1000]
}: {
  tokenEndtime?: number;
  mapId?: string;
  congregationcode?: string;
  maxTries?: number;
  pubName?: string;
  floorFilter?: Array<number>;
  seqFilter?: Array<number>;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [floors, setFloors] = useState<Array<floorDetails>>([]);
  const [postalName, setPostalName] = useState<string>();
  const [postalZip, setPostalZip] = useState<string>();
  const [values, setValues] = useState<object>({});
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [options, setOptions] = useState<Array<OptionProps>>([]);
  const [territoryType, setTerritoryType] = useState<number>(
    TERRITORY_TYPES.PUBLIC
  );

  const handleUnitUpdate = (
    addressId: string,
    floor: number,
    unit: string,
    maxUnitNumber: number,
    options: Array<OptionProps>
  ) => {
    const floorUnits = floors.find((e) => e.floor === floor);
    const unitDetails = floorUnits?.units.find((e) => e.number === unit);

    ModalManager.show(UpdateUnitStatus, {
      addressId: addressId,
      options: options,
      addressName: postalName,
      // CONDUCTOR ACL because publishers should be able to update status
      userAccessLevel: USER_ACCESS_LEVELS.CONDUCTOR.CODE,
      territoryType: territoryType,
      congregation: congregationcode,
      postalCode: mapId,
      unitNo: unit,
      unitNoDisplay: ZeroPad(unit, maxUnitNumber),
      floor: floor,
      floorDisplay: ZeroPad(floor.toString(), DEFAULT_FLOOR_PADDING),
      unitDetails: unitDetails,
      addressData: undefined,
      defaultOption: policy.defaultType,
      isMultiselect: policy.isMultiselect,
      updatedBy: pubName
    });
  };

  const prepareTerritory = async () => {
    const options = await getOptions(congregationcode);
    setOptions(options);

    const congregationRef = doc(
      firestore,
      `congregations/${congregationcode}/maps/${mapId}`
    );
    onSnapshot(congregationRef, (congregationSnapshot) => {
      const congregationData = congregationSnapshot.data();
      const name = congregationData?.name;
      const territoryType = congregationData?.type;
      const feedback = congregationData?.feedback;
      const instructions = congregationData?.instructions;
      const postalCode = congregationData?.postal_code;
      const isMultiType = congregationData?.multiType;
      setPolicy(new Policy(undefined, options, maxTries, isMultiType));
      setValues((values) => ({
        ...values,
        feedback: feedback,
        instructions: instructions
      }));
      setPostalName(name);
      setPostalZip(postalCode);
      setTerritoryType(territoryType);
      document.title = name;
    });

    const whereConditions = [where("map", "==", mapId)];
    let orderByConditions = [orderBy("floor", "desc"), orderBy("sequence")];

    if (territoryType === TERRITORY_TYPES.PUBLIC) {
      whereConditions.push(where("floor", ">=", floorFilter[0]));
      whereConditions.push(where("floor", "<=", floorFilter[1]));
    }

    if (territoryType === TERRITORY_TYPES.PRIVATE) {
      whereConditions.push(where("sequence", ">=", seqFilter[0]));
      whereConditions.push(where("sequence", "<=", seqFilter[1]));
      orderByConditions = [orderBy("sequence"), orderBy("floor", "desc")];
    }

    console.log(whereConditions);

    onSnapshot(
      query(
        collection(firestore, `congregations/${congregationcode}/addresses`),
        ...whereConditions,
        ...orderByConditions
      ),
      (snapshot) => {
        const floorDetails = new Map<number, Array<unitDetails>>();
        snapshot.forEach((address) => {
          const addressData = address.data();
          const floor = addressData.floor;
          const unit = addressData.number;
          const status = addressData.status;
          const type = addressData.type;
          const note = addressData.note;
          const nhcount = addressData.nhcount;
          const sequence = addressData.sequence;
          const dnctime = addressData.dnctime;

          const unitData = {
            addressId: address.id,
            number: unit,
            status: status,
            type: type,
            note: note,
            nhcount: nhcount,
            sequence: sequence,
            dnctime: dnctime
          };
          const unitDetails = floorDetails.get(floor) || [];
          unitDetails.push(unitData);
          floorDetails.set(floor, unitDetails);
        });

        const floors = [] as Array<floorDetails>;
        const floorKeys = Array.from(floorDetails.keys());
        floorKeys.forEach((floorKey) => {
          const floorUnits = floorDetails.get(floorKey);
          if (floorUnits) {
            const floorUnitDetails = {
              floor: floorKey,
              units: floorUnits
            };
            floors.push(floorUnitDetails);
          }
        });

        setFloors(floors);
        setIsLoading(false);
      }
    );
  };

  useEffect(() => {
    prepareTerritory();
  }, []);

  const maxUnitNumberLength = useMemo(() => getMaxUnitLength(floors), [floors]);
  const completedPercent = useMemo(
    () => getCompletedPercent(policy as Policy, floors),
    [policy, floors]
  );
  if (isLoading) return <Loader />;

  const instructions =
    (values as valuesDetails).instructions ||
    `The is something nice
    
    what to do`;
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sheet
        sx={{
          display: { xs: "flex", md: "flex" },
          alignItems: "center",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          width: "100vw",
          height: "var(--Header-height)",
          zIndex: 200,
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
          <Badge color="warning" badgeContent={instructions ? "" : 0}>
            <MenuIcon />
          </Badge>
        </IconButton>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          <Box
            sx={{
              gap: 1,
              alignItems: "center",
              display: { xs: "flex", sm: "flex" }
            }}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography level="title-sm">{postalName}</Typography>
                <Typography level="body-xs">{postalZip}</Typography>
              </Box>
            </Box>
          </Box>
          <ColorSchemeToggle sx={{ alignSelf: "center" }} />
        </Box>
      </Sheet>
      <Sheet
        className="Sidebar"
        sx={{
          position: { xs: "fixed", md: "sticky" },
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
            md: "none"
          },
          transition: "transform 0.4s, width 0.4s",
          zIndex: 200,
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
            zIndex: 200,
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
            <img src="/favicon-32x32.png" alt="Ministry Mapper Icon" />
          </IconButton>
          <Typography level="title-sm">{pubName}</Typography>
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
          <Card
            invertedColors
            variant="soft"
            color="warning"
            size="sm"
            sx={{ boxShadow: "none" }}
          >
            <Typography level="title-sm" startDecorator={<AssignmentIcon />}>
              Instructions
            </Typography>
            <CardContent orientation="horizontal">
              <Typography level="body-xs">{instructions}</Typography>
            </CardContent>
          </Card>
          <List
            size="sm"
            sx={{
              gap: 1,
              "--List-nestedInsetStart": "30px",
              "--ListItem-radius": (theme) => theme.vars.radius.sm
            }}
          >
            <ListItem>
              <ListItemDecorator>
                <TimerIcon />
              </ListItemDecorator>
              <Countdown
                // className="m-1"
                date={tokenEndtime}
                // daysInHours={true}
                renderer={(props) => {
                  const daysDisplay =
                    props.days !== 0 ? <>{props.days}d </> : <></>;
                  const hoursDisplay =
                    props.hours !== 0 ? <>{props.hours}h </> : <></>;
                  const minsDisplay =
                    props.minutes !== 0 ? <>{props.minutes}m </> : <></>;
                  return (
                    <Typography level="title-sm">
                      {daysDisplay}
                      {hoursDisplay}
                      {minsDisplay}
                      {props.formatted.seconds}s
                    </Typography>
                  );
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemButton
                onClick={() =>
                  window.open(GetDirection(postalZip as string), "_blank")
                }
              >
                <DirectionsIcon />
                <ListItemContent>
                  <Typography level="title-sm">Direction</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton
                onClick={() =>
                  ModalManager.show(UpdateAddressFeedback, {
                    footerSaveAcl: USER_ACCESS_LEVELS.CONDUCTOR.CODE,
                    name: postalName as string,
                    congregation: congregationcode,
                    mapId: mapId,
                    currentFeedback: (values as valuesDetails).feedback,
                    currentName: pubName,
                    helpLink: WIKI_CATEGORIES.PUBLISHER_ADDRESS_FEEDBACK
                  })
                }
              >
                <Badge
                  badgeContent={(values as valuesDetails).feedback ? "" : 0}
                >
                  <FeedbackIcon />
                </Badge>

                <ListItemContent>
                  <Typography level="title-sm">Feedback</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Sheet>
      <Sheet
        sx={{
          pt: "var(--Header-height)",
          // display",
          // px: { xs: 2, md: 6 },
          // pt: {
          //   xs: "calc(12px + var(--Header-height))",
          //   sm: "calc(12px + var(--Header-height))",
          //   md: "calc(3rem + var(--Header-height))"
          // },
          // pb: { xs: 2, sm: 2, md: 3 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "95vh",
          overflow: "auto",
          gap: 1
        }}
      >
        <PublisherTerritoryTable
          postalCode={mapId}
          floors={floors}
          maxUnitNumberLength={maxUnitNumberLength}
          policy={policy}
          completedPercent={completedPercent}
          territoryType={territoryType}
          handleUnitStatusUpdate={(event) => {
            const { floor, unitno, addressid } = event.currentTarget.dataset;
            handleUnitUpdate(
              addressid as string,
              Number(floor),
              unitno as string,
              maxUnitNumberLength,
              options
            );
          }}
        />
      </Sheet>
    </Box>
  );
};

export default Slip;
