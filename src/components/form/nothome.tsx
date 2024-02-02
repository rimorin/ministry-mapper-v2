// import { InputGroup, ButtonGroup, Button } from "react-bootstrap";
import { Button, Stack, ToggleButtonGroup, Typography } from "@mui/joy";
import { NOT_HOME_STATUS_CODES } from "../../utils/constants";
import { FormProps } from "../../utils/interface";

const HHNotHomeField = ({ handleGroupChange, changeValue }: FormProps) => {
  return (
    // <div className="mb-1">
    //   <div className="mb-2 inline-block">Number of tries</div>
    //   <InputGroup className="justify-content-center">
    <Stack
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
      }}
      spacing={1}
    >
      <Typography level="title-sm">Number of tries</Typography>
      <ToggleButtonGroup
        // exclusive
        value={changeValue as string}
        // className="mb-3 group-wrap"
        // onChange={handleGroupChange}
        onChange={handleGroupChange}
      >
        <Button
          // id="nh-status-tb-0"
          // variant="outline-secondary"
          value={NOT_HOME_STATUS_CODES.DEFAULT}
        >
          1st
        </Button>
        <Button
          // id="nh-status-tb-1"
          // variant="outline-secondary"
          value={NOT_HOME_STATUS_CODES.SECOND_TRY}
        >
          2nd
        </Button>
        <Button
          // id="nh-status-tb-2"
          // variant="outline-secondary"
          value={NOT_HOME_STATUS_CODES.THIRD_TRY}
        >
          3rd
        </Button>
        <Button
          // id="nh-status-tb-3"
          // variant="outline-secondary"
          value={NOT_HOME_STATUS_CODES.FOURTH_TRY}
        >
          4th
        </Button>
      </ToggleButtonGroup>
    </Stack>
    //   </InputGroup>
    // </div>
  );
};

export default HHNotHomeField;
