import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  WIKI_CATEGORIES,
  DEFAULT_COORDINATES,
  MIN_START_FLOOR
} from "../../utils/constants";

import isValidMapSequence from "../../utils/helpers/checkvalidseq";
import useNotification from "../../hooks/useNotification";
import processSequence from "../../utils/helpers/processsequence";
import {
  NewPrivateAddressModalProps,
  latlongInterface
} from "../../utils/interface";
import FloorField from "../form/floors";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import GenericTextAreaField from "../form/textarea";
import HelpButton from "../navigation/help";
import ChangeMapGeolocation from "./changegeolocation";
import { callFunction } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";

const NewMap = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    origin
  }: NewPrivateAddressModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const { showModal } = useModalManagement();
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [coordinates, setCoordinates] = useState<latlongInterface>(
      DEFAULT_COORDINATES.Singapore
    );
    const [sequence, setSequence] = useState("");
    const [mapType, setMapType] = useState(TERRITORY_TYPES.MULTIPLE_STORIES);
    const [floors, setFloors] = useState(MIN_START_FLOOR);
    const [isSaving, setIsSaving] = useState(false);

    const isMultiStory = mapType === TERRITORY_TYPES.MULTIPLE_STORIES;

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      if (!isValidMapSequence(sequence, mapType)) {
        notifyWarning(t("map.invalidSequence"));
        return;
      }

      setIsSaving(true);
      try {
        await callFunction("/map/add", {
          method: "POST",
          body: {
            name,
            sequence,
            type: mapType,
            coordinates: JSON.stringify(coordinates),
            congregation,
            territory: territoryCode,
            floors: isMultiStory ? floors : MIN_START_FLOOR
          }
        });
        modal.resolve();
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleLocationSelect = async () => {
      const result = await showModal(ChangeMapGeolocation, {
        coordinates: coordinates,
        origin: origin,
        isSelectOnly: true
      });
      const newCoordinates = result as latlongInterface;
      if (newCoordinates) {
        setLocation(`${newCoordinates.lat}, ${newCoordinates.lng}`);
        setCoordinates(newCoordinates);
      }
    };

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>{t("map.createMap")}</Modal.Title>
          <HelpButton
            link={
              isMultiStory
                ? WIKI_CATEGORIES.CREATE_PUBLIC_ADDRESS
                : WIKI_CATEGORIES.CREATE_PRIVATE_ADDRESS
            }
          />
        </Modal.Header>
        <Form onSubmit={handleCreateTerritoryAddress}>
          <Modal.Body
            style={{
              maxHeight: window.innerHeight < 700 ? "70dvh" : "80dvh",
              overflowY: "auto"
            }}
          >
            <Form.Group className="mb-3" controlId="basicFormMapType">
              <Form.Label>{t("map.mapType")}</Form.Label>
              <Form.Select
                value={mapType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setMapType(e.target.value)
                }
                required
              >
                <option value={TERRITORY_TYPES.MULTIPLE_STORIES}>
                  {t("map.multiStory")}
                </option>
                <option value={TERRITORY_TYPES.SINGLE_STORY}>
                  {t("map.singleStory")}
                </option>
              </Form.Select>
              <Form.Text muted>{t("map.mapTypeInfo")}</Form.Text>
            </Form.Group>
            <p>
              {isMultiStory
                ? t("map.multiStoryDescription")
                : t("map.singleStoryDescription")}
            </p>
            <GenericInputField
              label={t("map.mapName")}
              name="name"
              handleChange={(e: ChangeEvent<HTMLElement>) =>
                setName((e.target as HTMLInputElement).value)
              }
              changeValue={name}
              required={true}
              information={t("map.descriptionInfo")}
              autoComplete="off"
            />
            <GenericInputField
              label={t("map.mapCoordinates")}
              name="location"
              placeholder={t("map.clickToSelectLocation")}
              handleClick={handleLocationSelect}
              changeValue={location}
              required={true}
              handleChange={() => {}}
              information={t("map.coordinatesInfo")}
              autoComplete="off"
            />
            {isMultiStory && (
              <FloorField
                handleChange={(e: ChangeEvent<HTMLElement>) =>
                  setFloors(Number((e.target as HTMLInputElement).value))
                }
                changeValue={floors}
              />
            )}
            <GenericTextAreaField
              label={t("map.sequence")}
              name="units"
              handleChange={(e: ChangeEvent<HTMLElement>) =>
                setSequence(
                  processSequence(
                    (e.target as HTMLInputElement).value,
                    isMultiStory
                  )
                )
              }
              changeValue={sequence}
              required={true}
              information={t("map.sequenceExplanation")}
            />
          </Modal.Body>
          <ModalFooter
            submitLabel={t("common.create")}
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default NewMap;
