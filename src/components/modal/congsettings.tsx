import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, useContext } from "react";
import {
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_SELF_DESTRUCT_HOURS,
  USER_ACCESS_LEVELS,
  DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { firestore } from "../../firebase";
import ModalFooter from "../form/footer";
import {
  AlertSnackbarProps,
  UpdateCongregationSettingsModalProps
} from "../../utils/interface";
import { updateDoc, doc } from "firebase/firestore";
// import {
//   Box,
//   Checkbox,
//   DialogContent,
//   DialogTitle,
//   FormControl,
//   FormLabel,
//   Input,
//   Modal,
//   ModalDialog,
//   Radio,
//   RadioGroup,
//   Slider,
//   Stack
// } from "@mui/joy";
import { AlertContext } from "../utils/context";
import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Slider,
  Stack
} from "@mui/material";

const UpdateCongregationSettings = NiceModal.create(
  ({
    currentName,
    currentCongregation,
    currentMaxTries = DEFAULT_CONGREGATION_MAX_TRIES,
    currentDefaultExpiryHrs = DEFAULT_SELF_DESTRUCT_HOURS,
    currentIsMultipleSelection = DEFAULT_CONGREGATION_OPTION_IS_MULTIPLE
  }: UpdateCongregationSettingsModalProps) => {
    const modal = useModal();
    const rollbar = useRollbar();
    const [maxTries, setMaxTries] = useState(currentMaxTries);
    const [defaultExpiryHrs, setDefaultExpiryHrs] = useState(
      currentDefaultExpiryHrs
    );
    const [congregationName, setName] = useState(currentName);
    const [isMultipleSelection, setIsMultipleSelection] = useState<boolean>(
      currentIsMultipleSelection
    );
    const [isSaving, setIsSaving] = useState(false);
    const { setSnackbarAlert } = useContext(AlertContext) as AlertSnackbarProps;

    const handleSubmitCongSettings = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      try {
        setIsSaving(true);
        await updateDoc(
          doc(firestore, `congregations/${currentCongregation}`),
          {
            name: congregationName,
            expiry_hours: defaultExpiryHrs,
            max_tries: maxTries,
            multi_type: isMultipleSelection
          }
        );
        setSnackbarAlert({
          open: true,
          message: "Congregation settings updated successfully!",
          color: "success"
        });
        // alert("Congregation settings updated successfully!");
        // window.location.reload();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog size="lg"> */}
        <DialogTitle>Congregation Settings</DialogTitle>
        <form onSubmit={handleSubmitCongSettings}>
          <DialogContent>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Label</FormLabel>
                <Input
                  placeholder="Enter congregation name"
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    setName(value);
                  }}
                  value={congregationName}
                />
                {/* <FormHelperText>This is a helper text.</FormHelperText> */}
              </FormControl>
              <FormControl>
                <FormLabel>Max Tries</FormLabel>
                <RadioGroup
                  defaultValue={2}
                  value={maxTries}
                  // orientation="horizontal"
                  row
                  sx={{ gap: 2 }}
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    console.log(value);
                    setMaxTries(parseInt(value));
                  }}
                >
                  <FormControlLabel
                    value={1}
                    control={<Radio />}
                    label="1"
                    labelPlacement="bottom"
                    sx={{
                      mb: 2
                    }}
                  />
                  <FormControlLabel
                    value={2}
                    control={<Radio />}
                    label="2"
                    labelPlacement="bottom"
                    sx={{
                      mb: 2
                    }}
                  />
                  <FormControlLabel
                    value={3}
                    control={<Radio />}
                    label="3"
                    labelPlacement="bottom"
                    sx={{
                      mb: 2
                    }}
                  />
                  <FormControlLabel
                    value={4}
                    control={<Radio />}
                    label="4"
                    labelPlacement="bottom"
                    sx={{
                      mb: 2
                    }}
                  />
                  {/* <Radio value={1} label="1" variant="soft" />

                  <Radio
                    value={2}
                    label="2"
                    variant="soft"
                    sx={{
                      mb: 2
                    }}
                  />
                  <Radio
                    value={3}
                    label="3"
                    variant="soft"
                    sx={{
                      mb: 2
                    }}
                  />
                  <Radio
                    value={4}
                    label="4"
                    variant="soft"
                    sx={{
                      mb: 2
                    }}
                  /> */}
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormLabel>Default Slip Expiry Hours</FormLabel>
                <Box
                  sx={
                    // left and right padding
                    {
                      px: 3,
                      // top margin
                      mt: 2
                    }
                  }
                >
                  <Slider
                    value={defaultExpiryHrs}
                    min={1}
                    max={24}
                    marks={[
                      {
                        value: 1,
                        label: "1Hr"
                      },
                      {
                        value: 6,
                        label: "6Hrs"
                      },
                      {
                        value: 12,
                        label: "12Hrs"
                      },
                      {
                        value: 18,
                        label: "18Hrs"
                      },
                      {
                        value: 24,
                        label: "24Hrs"
                      }
                    ]}
                    valueLabelDisplay="on"
                    onChange={(event) => {
                      const { value } = event.target as HTMLInputElement;
                      console.log(value);
                      setDefaultExpiryHrs(parseInt(value));
                    }}
                  />
                </Box>
              </FormControl>
              <FormControl>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        onChange={(event) => {
                          setIsMultipleSelection(event.target.checked);
                        }}
                        checked={isMultipleSelection}
                      />
                    }
                    label="Multiple Household Types"
                  />
                </Box>
              </FormControl>
            </Stack>
          </DialogContent>
          <ModalFooter
            handleClick={modal.hide}
            isSaving={isSaving}
            userAccessLevel={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
          />
        </form>
        {/* </ModalDialog> */}
        {/* <Form onSubmit={handleSubmitCongSettings}> */}
        {/* <Modal.Header>
            <Modal.Title></Modal.Title>
            <HelpButton link={WIKI_CATEGORIES.MANAGE_CONG_SETTINGS} />
          </Modal.Header> */}
        {/* <Modal.Body>
            <Form.Group className="mb-3" controlId="formBasicCongName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter congregation name"
                onChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setName(value);
                }}
                value={congregationName}
              />
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formBasicTriesRange"
              as={Row}
            >
              <Form.Label>No. of Tries</Form.Label>
              <Col xs="9">
                <RangeSlider
                  tooltip="off"
                  min={2}
                  max={4}
                  value={maxTries}
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    setMaxTries(parseInt(value));
                  }}
                />
              </Col>
              <Col xs="3">
                <Form.Control value={maxTries} disabled />
              </Col>
              <Form.Text muted>
                The number of times to try not at homes before considering it
                done
              </Form.Text>
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formBasicExpiryHoursRange"
              as={Row}
            >
              <Form.Label>Default Slip Expiry Hours</Form.Label>
              <Col xs="9">
                <RangeSlider
                  tooltip="off"
                  min={1}
                  max={24}
                  value={defaultExpiryHrs}
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    setDefaultExpiryHrs(parseInt(value));
                  }}
                />
              </Col>
              <Col xs="3">
                <Form.Control value={defaultExpiryHrs} disabled />
              </Col>
              <Form.Text muted>
                The duration of the territory slip link before it expires
              </Form.Text>
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formSwitchMultipleSelection"
            >
              <Form.Check
                type="switch"
                label="Multiple Household Types"
                checked={isMultipleSelection}
                onChange={(event) => {
                  setIsMultipleSelection(event.target.checked);
                }}
              />
              <Form.Text muted>
                Allow multiple options to be selected in the household dropdown
              </Form.Text>
            </Form.Group>
          </Modal.Body> */}

        {/* </Form> */}
      </Dialog>
    );
  }
);

export default UpdateCongregationSettings;
