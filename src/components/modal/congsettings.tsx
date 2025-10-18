import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent } from "react";
import { Form, Row, Col, Modal } from "react-bootstrap";
import {
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_SELF_DESTRUCT_HOURS,
  WIKI_CATEGORIES,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import HelpButton from "../navigation/help";
import ModalFooter from "../form/footer";
import { UpdateCongregationSettingsModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";
import { useTranslation } from "react-i18next";

const UpdateCongregationSettings = NiceModal.create(
  ({
    currentName,
    currentCongregation,
    currentMaxTries = DEFAULT_CONGREGATION_MAX_TRIES,
    currentDefaultExpiryHrs = DEFAULT_SELF_DESTRUCT_HOURS
  }: UpdateCongregationSettingsModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();

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
        await updateDataById(
          "congregations",
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
        alert(
          t("congregation.settingsUpdated", "Congregation settings updated.")
        );
        window.location.reload();
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Form onSubmit={handleSubmitCongSettings}>
          <Modal.Header>
            <Modal.Title>
              {t("congregation.settings", "Congregation Settings")}
            </Modal.Title>
            <HelpButton link={WIKI_CATEGORIES.MANAGE_CONG_SETTINGS} />
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formBasicCongName">
              <Form.Label>{t("common.name", "Name")}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t(
                  "congregation.enterName",
                  "Enter congregation name"
                )}
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
              <Form.Label>
                {t("congregation.numberOfTries", "No. of Tries")}
              </Form.Label>
              <Col xs="9">
                <Form.Range
                  min={1}
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
                {t(
                  "congregation.triesDescription",
                  "The number of times to try not at homes before considering it done"
                )}
              </Form.Text>
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formBasicExpiryHoursRange"
              as={Row}
            >
              <Form.Label>
                {t(
                  "congregation.defaultSlipExpiry",
                  "Default Slip Expiry Hours"
                )}
              </Form.Label>
              <Col xs="9">
                <Form.Range
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
                {t(
                  "congregation.expiryDescription",
                  "The duration of the territory slip link before it expires"
                )}
              </Form.Text>
            </Form.Group>
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
