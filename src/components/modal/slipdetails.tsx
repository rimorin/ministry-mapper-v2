import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, FormEvent } from "react";
// import Calendar from "react-calendar";
import {
  WIKI_CATEGORIES,
  USER_ACCESS_LEVELS,
  DEFAULT_SELF_DESTRUCT_HOURS,
  TERRITORY_TYPES
} from "../../utils/constants";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import {
  ConfirmSlipDetailsModalProps,
  floorDetails
} from "../../utils/interface";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Modal,
  ModalDialog,
  Slider,
  Stack,
  ToggleButtonGroup,
  Typography
} from "@mui/joy";
import Calendar from "react-calendar";
import DateTimePicker from "react-datetime-picker";

const ConfirmSlipDetails = NiceModal.create(
  ({
    addressName,
    userAccessLevel,
    marks,
    type,
    defaultExpiryHrs = DEFAULT_SELF_DESTRUCT_HOURS
  }: ConfirmSlipDetailsModalProps) => {
    const defaultExpiryDate = new Date(
      Date.now() + 3600 * 1000 * defaultExpiryHrs
    );
    const modal = useModal();

    console.log(marks);
    const defaultRange = marks
      ? [marks[0].value, marks[marks.length - 1].value]
      : [];

    const [sliderValue, setSliderValue] = useState<number>(0);
    const [filterValue, setFilterValue] = useState<Array<number>>(defaultRange);
    const [linkExpiryHrs, setLinkExpiryHrs] =
      useState<number>(defaultExpiryHrs);
    const [expiryDate, setExpiryDate] = useState<Date>(defaultExpiryDate);
    const [expiryType, setExpiryType] = useState<"hrs" | "wks" | "mths">("hrs"); // hrs or date
    const [name, setName] = useState<string>();

    const handleSubmitPersonalSlip = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      modal.resolve({ linkExpiryHrs: linkExpiryHrs, publisherName: name });
      modal.hide();
    };
    return (
      <Modal open={modal.visible} onClose={() => modal.hide()}>
        <ModalDialog>
          <DialogTitle
            sx={{
              // center the title
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Typography level="h3">{addressName}</Typography>
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
              <Typography level="title-lg">Date Of Expiry</Typography>
              <Typography level="body-md">
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
                size="sm"
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
              {marks && marks.length > 0 && (
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  {" "}
                  <Typography level="title-sm">
                    {type === TERRITORY_TYPES.PUBLIC ? "Floors" : "Houses"}
                  </Typography>
                  <Slider
                    sx={{
                      width: "80%",
                      marginTop: "0.5rem"
                    }}
                    track="normal"
                    value={filterValue}
                    onChange={(event, newValue) =>
                      setFilterValue(newValue as Array<number>)
                    }
                    aria-labelledby="discrete-slider"
                    valueLabelDisplay="on"
                    step={1}
                    valueLabelFormat={(value) => {
                      const index = marks.findIndex(
                        (mark) => mark.value === value
                      );
                      if (index === -1) return "";
                      return marks[index].label;
                    }}
                    min={defaultRange[0]}
                    max={defaultRange[1]}
                  />
                </Box>
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
        </ModalDialog>
      </Modal>
    );
  }
);

export default ConfirmSlipDetails;
