// import { Form, ButtonGroup, Button } from "react-bootstrap";
import {
  Box,
  Button,
  IconButton,
  Stack,
  ToggleButtonGroup,
  Typography
} from "@mui/joy";
import { STATUS_CODES, STATUS_CODES_DESCRIPTION } from "../../utils/constants";
import { FormProps } from "../../utils/interface";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb";
import CancelIcon from "@mui/icons-material/Cancel";
const HHStatusField = ({ handleGroupChange, changeValue }: FormProps) => {
  return (
    <Stack spacing={1}>
      <Typography
        sx={{
          textAlign: "center"
        }}
        level="title-sm"
      >
        {STATUS_CODES_DESCRIPTION[changeValue as number]}
      </Typography>
      <ToggleButtonGroup
        value={changeValue as string}
        onChange={handleGroupChange}
      >
        {/* <Button
          id="status-tb-0"
          startDecorator={<IndeterminateCheckBoxIcon />}
          // variant="outline-dark"
          value={STATUS_CODES.DEFAULT}
          className="fluid-button"
        >
          <Typography level="title-sm">Not Done</Typography>
        </Button> */}
        <IconButton
          value={STATUS_CODES.DEFAULT}
          sx={{
            width: "20%"
          }}
        >
          <IndeterminateCheckBoxIcon />
        </IconButton>
        {/* <Button
          id="status-tb-1"
          startDecorator={<CheckBoxIcon color="success" />}
          value={STATUS_CODES.DONE}
          className="fluid-button"
        >
          <Typography level="title-sm">Done</Typography>
        </Button> */}
        <IconButton
          value={STATUS_CODES.DONE}
          sx={{
            width: "20%"
          }}
        >
          <CheckBoxIcon color="success" />
        </IconButton>
        {/* <Button
          id="status-tb-2"
          startDecorator={<NightShelterIcon />}
          value={STATUS_CODES.NOT_HOME}
          className="fluid-button"
        >
          <Typography level="title-sm">Not Home</Typography>
        </Button> */}
        <IconButton
          value={STATUS_CODES.NOT_HOME}
          sx={{
            width: "20%"
          }}
        >
          <NightShelterIcon />
        </IconButton>
        {/* <Button
          id="status-tb-4"
          startDecorator={<DoNotDisturbIcon color="warning" />}
          value={STATUS_CODES.DO_NOT_CALL}
          className="fluid-button"
        >
          <Typography level="title-sm">DNC</Typography>
        </Button> */}
        <IconButton
          value={STATUS_CODES.DO_NOT_CALL}
          sx={{
            width: "20%"
          }}
        >
          <DoNotDisturbIcon color="warning" />
        </IconButton>
        {/* <Button
          id="status-tb-5"
          startDecorator={<CancelIcon />}
          value={STATUS_CODES.INVALID}
          className="fluid-button"
        >
          <Typography level="title-sm">Invalid</Typography>
        </Button> */}
        <IconButton
          size="lg"
          value={STATUS_CODES.INVALID}
          sx={{
            width: "20%"
          }}
        >
          <CancelIcon />
        </IconButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default HHStatusField;
