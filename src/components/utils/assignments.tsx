import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import { LinkSession } from "../../utils/policies";
import { UNSUPPORTED_BROWSER_MSG } from "../../utils/constants";
import buildLink from "../../utils/helpers/buildlink";
import DeleteIcon from "@mui/icons-material/Delete";
import LaunchIcon from "@mui/icons-material/Launch";
import { firestore } from "../../firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { DateTimeField } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
type AppProps = {
  linkId: string;
  linkSessions: LinkSession[];
};

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Assignments({ linkId, linkSessions }: AppProps) {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: number
  ) => {
    setCurrentTabIndex(value);
  };

  return (
    <>
      <Tabs
        value={currentTabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}
      >
        {linkSessions.map((session, index) => (
          <Tab key={index} label={session.publisher_name} id={`tab-${index}`} />
        ))}
      </Tabs>
      {linkSessions.map((session, index) => (
        <CustomTabPanel
          key={`tabpanel-${index}`}
          value={currentTabIndex}
          index={index}
        >
          <>
            <Box
              sx={{
                gap: 2
              }}
            >
              <Stack
                gap={1}
                direction={{ xs: "column", sm: "row" }}
                marginBottom={1}
                alignItems={{ xs: "center", sm: "flex-start" }}
              >
                <Paper elevation={1} sx={{ padding: 1, width: 160 }}>
                  <Typography variant="subtitle1" sx={{ textAlign: "center" }}>
                    Floor {session.lowest_floor} to {session.highest_floor}
                  </Typography>
                </Paper>
                <Paper
                  elevation={1}
                  sx={{
                    padding: 1,
                    width: 160
                  }}
                >
                  <Typography variant="subtitle1" sx={{ textAlign: "center" }}>
                    Sequence {session.lowest_sequence} to{" "}
                    {session.highest_sequence}
                  </Typography>
                </Paper>
              </Stack>
              <Divider />
              <Stack
                gap={1}
                direction={{ xs: "column", sm: "row" }}
                marginY={1}
                alignItems={{ xs: "center", sm: "flex-start" }}
              >
                <DateTimeField
                  label="Created Date"
                  readOnly
                  defaultValue={dayjs(session.create_date)}
                />
                <DateTimeField
                  label="Expiry Date"
                  readOnly
                  defaultValue={dayjs(session.end_date)}
                />
              </Stack>
              <Divider />
              <Stack
                gap={1}
                marginY={1}
                alignItems={{ xs: "center", sm: "flex-start" }}
              >
                <ButtonGroup variant="outlined">
                  <Button
                    startIcon={<LaunchIcon />}
                    onClick={async () => {
                      if (!navigator.share) {
                        alert(UNSUPPORTED_BROWSER_MSG);
                        return;
                      }
                      const linkUrl = new URL(
                        buildLink(session.key),
                        window.location.href
                      );
                      await navigator.share({
                        title: session.name,
                        text: assignmentMessage(session.name),
                        url: linkUrl.toString()
                      });
                    }}
                  >
                    Share
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={async () => {
                      await deleteDoc(doc(firestore, "links", linkId));
                    }}
                  >
                    Delete
                  </Button>
                </ButtonGroup>
              </Stack>
            </Box>
          </>
        </CustomTabPanel>
      ))}
    </>
  );
}

export default Assignments;
