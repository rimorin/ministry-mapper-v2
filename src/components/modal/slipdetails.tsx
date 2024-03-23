import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useState, FormEvent } from "react";
import {
  USER_ACCESS_LEVELS,
  DEFAULT_SELF_DESTRUCT_HOURS,
  TERRITORY_TYPES
} from "../../utils/constants";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import {
  ConfirmSlipDetailsModalProps,
  SliderMark
} from "../../utils/interface";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Slider,
  Stack,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
// import {
//   Box,
//   Button,
//   DialogContent,
//   DialogTitle,
//   Divider,
//   Modal,
//   ModalDialog,
//   Slider,
//   Stack,
//   ToggleButtonGroup,
//   Typography
// } from "@mui/joy";

const ConfirmSlipDetails = NiceModal.create(
  ({
    addressName,
    userAccessLevel,
    maxSequence,
    maxFloor,
    type,
    defaultExpiryHrs = DEFAULT_SELF_DESTRUCT_HOURS
  }: ConfirmSlipDetailsModalProps) => {
    const defaultExpiryDate = new Date(
      Date.now() + 3600 * 1000 * defaultExpiryHrs
    );
    const modal = useModal();

    const floorMarkings = [] as SliderMark[];

    const sequenceMarkings = [] as SliderMark[];

    for (let i = 0; i <= maxSequence; i++) {
      const value = i + 1;
      let suffix = "th";
      if (value === 1 || (value % 10 === 1 && value !== 11)) {
        suffix = "st";
      } else if (value === 2 || (value % 10 === 2 && value !== 12)) {
        suffix = "nd";
      } else if (value === 3 || (value % 10 === 3 && value !== 13)) {
        suffix = "rd";
      }
      sequenceMarkings.push({
        value: value,
        label: `${value}${suffix}`
      });
    }

    for (let i = 0; i <= maxFloor; i++) {
      const value = i + 1;
      let suffix = "th";
      if (value === 1 || (value % 10 === 1 && value !== 11)) {
        suffix = "st";
      } else if (value === 2 || (value % 10 === 2 && value !== 12)) {
        suffix = "nd";
      } else if (value === 3 || (value % 10 === 3 && value !== 13)) {
        suffix = "rd";
      }
      floorMarkings.push({
        value: value,
        label: `${value}${suffix}`
      });
    }

    console.log(floorMarkings);
    const defaultFloorRange = floorMarkings
      ? [floorMarkings[0].value, floorMarkings[floorMarkings.length - 1].value]
      : [];

    console.log(sequenceMarkings);

    const defaultSequenceRange = sequenceMarkings
      ? [
          sequenceMarkings[0].value,
          sequenceMarkings[sequenceMarkings.length - 1].value
        ]
      : [];

    const [sliderValue, setSliderValue] = useState<number>(0);
    const [floorFilterValue, setFloorFilterValue] =
      useState<Array<number>>(defaultFloorRange);
    const [sequenceFilterValue, setSequenceFilterValue] =
      useState<Array<number>>(defaultSequenceRange);
    const [linkExpiryHrs, setLinkExpiryHrs] =
      useState<number>(defaultExpiryHrs);
    const [expiryDate, setExpiryDate] = useState<Date>(defaultExpiryDate);
    const [expiryType, setExpiryType] = useState<"hrs" | "wks" | "mths">("hrs"); // hrs or date
    const [name, setName] = useState<string>();

    const handleSubmitPersonalSlip = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      modal.resolve({
        linkExpiryHrs: linkExpiryHrs,
        publisherName: name,
        lowestSequence: sequenceFilterValue[0],
        highestSequence: sequenceFilterValue[1],
        lowestFloor: floorFilterValue[0],
        highestFloor: floorFilterValue[1]
      });
      modal.hide();
    };
    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        <DialogTitle
          sx={{
            // center the title
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Typography variant="h3">{addressName}</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%"
            }}
            spacing={1}
          >
            <Typography variant="subtitle1">Date Of Expiry</Typography>
            <Typography variant="body1">
              {expiryDate.toLocaleDateString()}{" "}
              {expiryDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}
            </Typography>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Slider
                sx={{
                  width: "80%",
                  marginTop: "0.5rem"
                }}
                track="normal"
                value={sliderValue}
                onChange={(event, newValue) => {
                  setSliderValue(newValue as number);
                  if (typeof newValue === "number") {
                    let hours;
                    switch (expiryType) {
                      case "hrs":
                        hours = newValue;
                        break;
                      case "wks":
                        hours = newValue * 7 * 24;
                        break;
                      case "mths":
                        hours = newValue * 30 * 24;
                        break;
                      default:
                        hours = 0;
                        break;
                    }
                    setLinkExpiryHrs(hours);
                    setExpiryDate(
                      new Date(
                        defaultExpiryDate.getTime() + hours * 3600 * 1000
                      )
                    );
                  }
                }}
                aria-labelledby="discrete-slider"
                valueLabelDisplay="on"
                step={1}
                marks
                min={0}
                max={12}
              />
            </Box>
            <ToggleButtonGroup
              size="small"
              onChange={(event, value) => {
                if (typeof value === "string") {
                  setExpiryType(value as "hrs" | "wks" | "mths");
                  switch (value) {
                    case "hrs":
                      setLinkExpiryHrs(sliderValue);
                      setExpiryDate(
                        new Date(Date.now() + 3600 * 1000 * sliderValue)
                      );
                      break;
                    case "wks":
                      setLinkExpiryHrs(sliderValue * 7 * 24);
                      setExpiryDate(
                        new Date(
                          Date.now() + 3600 * 1000 * sliderValue * 7 * 24
                        )
                      );
                      break;
                    case "mths":
                      setLinkExpiryHrs(sliderValue * 30 * 24);
                      setExpiryDate(
                        new Date(
                          Date.now() + 3600 * 1000 * sliderValue * 30 * 24
                        )
                      );
                      break;
                    default:
                      break;
                  }
                }
              }}
              value={expiryType}
            >
              <Button value="hrs">Hours</Button>
              <Button value="wks">Weeks</Button>
              <Button value="mths">Months</Button>
            </ToggleButtonGroup>
            <Divider />
            {type === TERRITORY_TYPES.PUBLIC &&
              floorMarkings &&
              floorMarkings.length > 0 && (
                <>
                  <Typography variant="subtitle1">Floors</Typography>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Slider
                      sx={{
                        width: "80%",
                        marginTop: "0.5rem"
                      }}
                      track="normal"
                      value={floorFilterValue}
                      onChange={(event, newValue) =>
                        setFloorFilterValue(newValue as Array<number>)
                      }
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="on"
                      step={1}
                      valueLabelFormat={(value) => {
                        const index = floorMarkings.findIndex(
                          (mark) => mark.value === value
                        );
                        if (index === -1) return "";
                        return floorMarkings[index].label;
                      }}
                      min={defaultFloorRange[0]}
                      max={defaultFloorRange[1]}
                    />
                  </Box>
                </>
              )}
            {sequenceMarkings && sequenceMarkings.length > 0 && (
              <>
                <Typography variant="subtitle1">Sequences</Typography>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Slider
                    sx={{
                      width: "80%",
                      marginTop: "0.5rem"
                    }}
                    track="normal"
                    value={sequenceFilterValue}
                    onChange={(event, newValue) =>
                      setSequenceFilterValue(newValue as Array<number>)
                    }
                    aria-labelledby="discrete-slider"
                    valueLabelDisplay="on"
                    step={1}
                    valueLabelFormat={(value) => {
                      const index = sequenceMarkings.findIndex(
                        (mark) => mark.value === value
                      );
                      if (index === -1) return "";
                      return sequenceMarkings[index].label;
                    }}
                    min={defaultSequenceRange[0]}
                    max={defaultSequenceRange[1]}
                  />
                </Box>
              </>
            )}
            <Box
              sx={{
                width: "100%"
              }}
            >
              <GenericInputField
                label="Publishers Name"
                name="name"
                handleChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setName(value);
                }}
                placeholder="Names of the assigned publishers"
                changeValue={name}
                focus={true}
                required={true}
              />
            </Box>
          </Stack>
        </DialogContent>
        <form onSubmit={handleSubmitPersonalSlip}>
          <ModalFooter
            handleClick={() => modal.hide()}
            userAccessLevel={userAccessLevel}
            requiredAcLForSave={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
            isSaving={false}
            submitLabel="Confirm"
          />
        </form>
      </Dialog>
    );
  }
);

export default ConfirmSlipDetails;
