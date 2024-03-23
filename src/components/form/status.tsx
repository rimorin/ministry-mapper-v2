// import { ToggleButton, Stack, ToggleButtonGroup, Typography } from "@mui/joy";
import { STATUS_CODES, STATUS_CODES_DESCRIPTION } from "../../utils/constants";
import { FormProps } from "../../utils/interface";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import {
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton
} from "@mui/material";
const HHStatusField = ({ handleGroupChange, changeValue }: FormProps) => {
  return (
    <Stack spacing={1}>
      <Typography
        sx={{
          textAlign: "center"
        }}
        variant="subtitle1"
      >
        {STATUS_CODES_DESCRIPTION[changeValue as number]}
      </Typography>
      <ToggleButtonGroup
        value={changeValue as string}
        onChange={handleGroupChange}
        exclusive
      >
        <ToggleButton
          value={STATUS_CODES.DEFAULT}
          sx={{
            width: "20%"
          }}
        >
          <CheckBoxOutlineBlankIcon />
        </ToggleButton>
        <ToggleButton
          value={STATUS_CODES.DONE}
          sx={{
            width: "20%"
          }}
        >
          <CheckBoxIcon color="success" />
        </ToggleButton>
        <ToggleButton
          value={STATUS_CODES.NOT_HOME}
          sx={{
            width: "20%"
          }}
        >
          <NightShelterIcon />
        </ToggleButton>
        <ToggleButton
          value={STATUS_CODES.DO_NOT_CALL}
          sx={{
            width: "20%"
          }}
        >
          <DoNotDisturbIcon color="warning" />
        </ToggleButton>
        <ToggleButton
          // size="small"
          value={STATUS_CODES.INVALID}
          sx={{
            width: "20%"
          }}
        >
          <CancelIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default HHStatusField;
