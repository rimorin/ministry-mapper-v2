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
  NewPublicAddressModalProps,
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

const NewPublicAddress = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    origin
  }: NewPublicAddressModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const { showModal } = useModalManagement();
    const [name, setName] = useState("");
    const [sequence, setSequence] = useState("");
    const [floors, setFloors] = useState(MIN_START_FLOOR);
    const [location, setLocation] = useState("");
    const [coordinates, setCoordinates] = useState<latlongInterface>(
      DEFAULT_COORDINATES.Singapore
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      if (!isValidMapSequence(sequence, TERRITORY_TYPES.MULTIPLE_STORIES)) {
        notifyWarning(t("map.invalidSequence"));
        return;
      }

      setIsSaving(true);
      try {
        await callFunction("/map/add", {
          method: "POST",
          body: {
            congregation: congregation,
            territory: territoryCode,
            type: TERRITORY_TYPES.MULTIPLE_STORIES,
            name: name,
            coordinates: JSON.stringify(coordinates),
            floors: floors,
            sequence: sequence
          }
        });
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
          <Modal.Title>{t("map.createMultiStory")}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CREATE_PUBLIC_ADDRESS} />
        </Modal.Header>
        <Form onSubmit={handleCreateTerritoryAddress}>
          <Modal.Body
            style={{
              maxHeight: window.innerHeight < 700 ? "70dvh" : "80dvh",
              overflowY: "auto"
            }}
          >
            <p>{t("map.multiStoryDescription")}</p>
            <GenericInputField
              label={t("map.mapName")}
              name="name"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setName(value);
              }}
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
            <FloorField
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setFloors(Number(value));
              }}
              changeValue={floors}
            />
            <GenericTextAreaField
              label={t("map.unitSequence")}
              name="units"
              placeholder={t("map.unitSequenceInfo")}
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setSequence(processSequence(value, true));
              }}
              changeValue={sequence}
              required={true}
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

export default NewPublicAddress;
