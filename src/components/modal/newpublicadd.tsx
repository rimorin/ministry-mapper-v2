import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { pb } from "../../utils/pocketbase";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  WIKI_CATEGORIES,
  DEFAULT_COORDINATES
} from "../../utils/constants";
import isValidMapCode from "../../utils/helpers/checkvalidmapcd";
import isValidMapSequence from "../../utils/helpers/checkvalidseq";
import errorHandler from "../../utils/helpers/errorhandler";
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
const NewPublicAddress = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    territoryCode,
    origin
  }: NewPublicAddressModalProps) => {
    const [mapCode, setMapCode] = useState("");
    const [name, setName] = useState("");
    const [sequence, setSequence] = useState("");
    const [floors, setFloors] = useState(1);
    const [location, setLocation] = useState("");
    const [coordinates, setCoordinates] = useState<latlongInterface>(
      DEFAULT_COORDINATES.Singapore
    );
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();
    const modalDescription = "Map Number";

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      if (!isValidMapCode(mapCode)) {
        alert(`Invalid ${modalDescription}`);
        return;
      }

      if (!isValidMapSequence(sequence, TERRITORY_TYPES.MULTIPLE_STORIES)) {
        alert("Invalid sequence");
        return;
      }

      setIsSaving(true);
      try {
        await pb.send("map/add", {
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
        modal.resolve();
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Create Multi Story Map</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CREATE_PUBLIC_ADDRESS} />
        </Modal.Header>
        <Form onSubmit={handleCreateTerritoryAddress}>
          <Modal.Body
            style={{
              maxHeight: window.innerHeight < 700 ? "70dvh" : "80dvh",
              overflowY: "auto"
            }}
          >
            <p>
              This map will include multiple floors, each containing several
              units. The map is designed to organize and display units across
              different floors efficiently.
            </p>
            <GenericInputField
              inputType="number"
              label={"Map Number"}
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
              information="Latitude and Longitude of the map. This is used for direction purposes."
            />
            <FloorField
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setFloors(Number(value));
              }}
              changeValue={floors}
            />
            <GenericTextAreaField
              label="Unit Sequence"
              name="units"
              placeholder="Unit sequence with comma seperator. For eg, 301,303,305 ..."
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setSequence(value);
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

export default NewPublicAddress;
