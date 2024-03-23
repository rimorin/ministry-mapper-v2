import { memo } from "react";
import { STATUS_CODES } from "../../utils/constants";
import { unitProps } from "../../utils/interface";
// import { Badge, Box, Typography } from "@mui/joy";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb";
import CancelIcon from "@mui/icons-material/Cancel";
import { Badge, Box, Typography } from "@mui/material";
const UnitStatus = memo((props: unitProps) => {
  const householdType = props.type;
  const note = props.note;
  const currentStatus = props.status;
  const nhcount = props.nhcount;
  const defaultOption = props.defaultOption || "";
  let status = <></>;

  if (currentStatus === STATUS_CODES.INVALID) {
    status = <CancelIcon />;
  }
  if (currentStatus === STATUS_CODES.DONE) {
    status = <CheckBoxIcon color="success" />;
  }

  if (currentStatus === STATUS_CODES.DO_NOT_CALL) {
    status = <DoNotDisturbIcon color="warning" />;
  }

  if (currentStatus === STATUS_CODES.NOT_HOME) {
    status = <NightShelterIcon color="secondary" />;
  }

  const getHouseholdBadge = (householdType: string, defaultOption: string) => {
    if (householdType === defaultOption) {
      return <></>;
    }
    return (
      <Typography variant="subtitle1" sx={{ whiteSpace: "nowrap" }}>
        {householdType}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "end",
        gap: 1
      }}
    >
      <Badge
        badgeContent={currentStatus === STATUS_CODES.NOT_HOME ? nhcount : 0}
      >
        {status}
      </Badge>
      {getHouseholdBadge(householdType, defaultOption)}
      {note && <Typography variant="body1">🗒️</Typography>}
    </Box>
  );
});

export default UnitStatus;
