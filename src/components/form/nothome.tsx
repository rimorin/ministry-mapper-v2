// import { Button, Stack, ToggleButtonGroup, Typography } from "@mui/joy";
import {
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton
} from "@mui/material";
import { NOT_HOME_STATUS_CODES } from "../../utils/constants";
import { FormProps } from "../../utils/interface";

const HHNotHomeField = ({ handleGroupChange, changeValue }: FormProps) => {
  return (
    <Stack
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
      }}
      spacing={1}
    >
      <Typography variant="subtitle1">Number of tries</Typography>
      <ToggleButtonGroup
        exclusive
        value={changeValue as string}
        onChange={handleGroupChange}
      >
        <ToggleButton value={NOT_HOME_STATUS_CODES.DEFAULT}>1st</ToggleButton>
        <ToggleButton value={NOT_HOME_STATUS_CODES.SECOND_TRY}>
          2nd
        </ToggleButton>
        <ToggleButton value={NOT_HOME_STATUS_CODES.THIRD_TRY}>3rd</ToggleButton>
        <ToggleButton value={NOT_HOME_STATUS_CODES.FOURTH_TRY}>
          4th
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default HHNotHomeField;
