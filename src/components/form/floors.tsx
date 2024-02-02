import { Form } from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";
import { MIN_START_FLOOR, MAX_TOP_FLOOR } from "../../utils/constants";
import { FloorProps } from "../../utils/interface";
import { Box, FormControl, FormLabel, Slider } from "@mui/joy";

const FloorField = ({ handleChange, changeValue }: FloorProps) => {
  return (
    <FormControl>
      <FormLabel>No. of floors</FormLabel>
      {/* <RangeSlider
        min={MIN_START_FLOOR}
        max={MAX_TOP_FLOOR}
        value={changeValue}
        onChange={handleChange}
      /> */}
      <Box
        sx={{
          width: "90%",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "1rem"
        }}
      >
        <Slider
          valueLabelDisplay="on"
          min={MIN_START_FLOOR}
          max={MAX_TOP_FLOOR}
          value={changeValue}
          onChange={handleChange}
        />
      </Box>
    </FormControl>
  );
};

export default FloorField;
