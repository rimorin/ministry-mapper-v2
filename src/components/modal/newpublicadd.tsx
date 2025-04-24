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
import isValidMapCode from "../../utils/helpers/checkvalidmapcd";
import isValidMapSequence from "../../utils/helpers/checkvalidseq";
import errorHandler from "../../utils/helpers/errorhandler";
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

import ModalManager from "@ebay/nice-modal-react";
import { callFunction } from "../../utils/pocketbase";
const NewPublicAddress = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    origin
  }: NewPublicAddressModalProps) => {
    const { t } = useTranslation();
    const [mapCode, setMapCode] = useState("");
    const [name, setName] = useState("");
    const [sequence, setSequence] = useState("");
    const [floors, setFloors] = useState(MIN_START_FLOOR);
    const [location, setLocation] = useState("");
    const [coordinates, setCoordinates] = useState<latlongInterface>(
      DEFAULT_COORDINATES.Singapore
    );
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const modalDescription = t("map.mapNumber");

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      if (!isValidMapCode(mapCode)) {
        alert(t("map.invalidMapNumber"));
        return;
      }

      if (!isValidMapSequence(sequence, TERRITORY_TYPES.MULTIPLE_STORIES)) {
        alert(t("map.invalidSequence"));
        return;
      }

      setIsSaving(true);
      try {
        await callFunction("/map/add", {
          method: "POST",
          body: {
            code: mapCode,
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
        errorHandler(error);
      } finally {
        setIsSaving(false);
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
              inputType="number"
              label={modalDescription}
              name="refNo"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setMapCode(value);
              }}
              changeValue={mapCode}
              required={true}
              information={t("map.uniqueIdentifierInfo")}
            />
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
            />
            <GenericInputField
              label={t("map.mapCoordinates")}
              name="location"
              placeholder={t("map.clickToSelectLocation")}
              handleClick={() => {
                ModalManager.show(ChangeMapGeolocation, {
                  coordinates: coordinates,
                  origin: origin,
                  isNew: true
                }).then((result) => {
                  const coordinates = result as { lat: number; lng: number };
                  if (coordinates) {
                    setLocation(`${coordinates.lat}, ${coordinates.lng}`);
                    setCoordinates(coordinates);
                  }
                });
              }}
              changeValue={location}
              required={true}
              handleChange={() => {}}
              information={t("map.coordinatesInfo")}
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
