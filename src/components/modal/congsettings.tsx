import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { Form, Row, Col, Modal } from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";
import {
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_SELF_DESTRUCT_HOURS,
  WIKI_CATEGORIES,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import HelpButton from "../navigation/help";
import { pb } from "../../pocketbase";
import ModalFooter from "../form/footer";
import { UpdateCongregationSettingsModalProps } from "../../utils/interface";
import { usePostHog } from "posthog-js/react";

const UpdateCongregationSettings = NiceModal.create(
  ({
    currentName,
    currentCongregation,
    currentMaxTries = DEFAULT_CONGREGATION_MAX_TRIES,
    currentDefaultExpiryHrs = DEFAULT_SELF_DESTRUCT_HOURS
  }: UpdateCongregationSettingsModalProps) => {
    const modal = useModal();
    const rollbar = useRollbar();
    const posthog = usePostHog();
    const [maxTries, setMaxTries] = useState(currentMaxTries);
    const [defaultExpiryHrs, setDefaultExpiryHrs] = useState(
      currentDefaultExpiryHrs
    );
    const [name, setName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmitCongSettings = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      try {
        setIsSaving(true);
        await pb.collection("congregations").update(
          currentCongregation,
          {
            name: name,
            expiry_hours: defaultExpiryHrs,
            max_tries: maxTries
          },
          {
            requestKey: `congregations-details-${currentCongregation}`
          }
        );
        posthog?.capture("update_congregation_settings", {
          name: name,
          expiryHours: defaultExpiryHrs,
          maxTries: maxTries
        });
        alert("Congregation settings updated.");
        window.location.reload();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Form onSubmit={handleSubmitCongSettings}>
          <Modal.Header>
            <Modal.Title>Congregation Settings</Modal.Title>
            <HelpButton link={WIKI_CATEGORIES.MANAGE_CONG_SETTINGS} />
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formBasicCongName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter congregation name"
                onChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setName(value);
                }}
                value={name}
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
            {/* <Form.Group
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
            </Form.Group> */}
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            isSaving={isSaving}
            userAccessLevel={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
          />
        </Form>
      </Modal>
    );
  }
);

export default UpdateCongregationSettings;
