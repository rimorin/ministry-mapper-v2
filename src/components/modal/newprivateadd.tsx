import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
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
  NewPrivateAddressModalProps,
  latlongInterface
} from "../../utils/interface";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import GenericTextAreaField from "../form/textarea";
import HelpButton from "../navigation/help";
import ModalManager from "@ebay/nice-modal-react";
import ChangeMapGeolocation from "./changegeolocation";
import { callFunction } from "../../utils/pocketbase";

const NewPrivateAddress = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    origin
  }: NewPrivateAddressModalProps) => {
    const [mapCode, setMapCode] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [coordinates, setCoordinates] = useState<latlongInterface>(
      DEFAULT_COORDINATES.Singapore
    );
    const [sequence, setSequence] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const modalDescription = "Map Number";

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      if (!isValidMapCode(mapCode)) {
        alert(`Invalid ${modalDescription}`);
        return;
      }

      if (!isValidMapSequence(sequence, TERRITORY_TYPES.SINGLE_STORY)) {
        alert("Invalid sequence");
        return;
      }

      setIsSaving(true);
      try {
        await callFunction("/map/add", {
          method: "POST",
          body: {
            code: mapCode,
            name: name,
            sequence: sequence,
            type: TERRITORY_TYPES.SINGLE_STORY,
            coordinates: JSON.stringify(coordinates),
            congregation: congregation,
            territory: territoryCode,
            floors: MIN_START_FLOOR
          }
        });
        modal.resolve();
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
          <Modal.Title>Create Single Story Property</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CREATE_PRIVATE_ADDRESS} />
        </Modal.Header>
        <Form onSubmit={handleCreateTerritoryAddress}>
          <Modal.Body
            style={{
              maxHeight: window.innerHeight < 700 ? "70dvh" : "80dvh",
              overflowY: "auto"
            }}
          >
            <p>This is a map with a list of single-story properties</p>
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
              information="This is a unique identifier for the map, requiring a minimum of 6 unique digits."
            />
            <GenericInputField
              label="Map Name"
              name="name"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setName(value);
              }}
              changeValue={name}
              required={true}
              information="Description of the map."
            />
            <GenericInputField
              label="Map Coordinates"
              name="location"
              placeholder="Click to select location"
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
              information="Latitude and Longitude of the map. This is used for direction purposes."
            />
            <GenericTextAreaField
              label="House Sequence"
              name="units"
              placeholder="House sequence with comma seperator. For eg, 1A,1B,2A ..."
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setSequence(processSequence(value));
              }}
              changeValue={sequence}
              required={true}
            />
          </Modal.Body>
          <ModalFooter
            submitLabel="Create"
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default NewPrivateAddress;
