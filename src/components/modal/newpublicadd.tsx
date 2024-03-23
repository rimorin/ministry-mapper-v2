import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { firestore } from "../../firebase";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  STATUS_CODES,
  NOT_HOME_STATUS_CODES
} from "../../utils/constants";
import isValidPostal from "../../utils/helpers/checkvalidpostal";
import isValidPostalSequence from "../../utils/helpers/checkvalidseq";
import processPropertyNumber from "../../utils/helpers/processpropertyno";
import errorHandler from "../../utils/helpers/errorhandler";
import { NewPublicAddressModalProps } from "../../utils/interface";
import FloorField from "../form/floors";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import GenericTextAreaField from "../form/textarea";
import { getDocs, collection, where, query, addDoc } from "firebase/firestore";
import MultiBatchSetter from "../../utils/helpers/multibatchcreate";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
// import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const NewPublicAddress = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    defaultType,
    territoryId
  }: NewPublicAddressModalProps) => {
    const [postalCode, setPostalCode] = useState("");
    const [name, setName] = useState("");
    const [sequence, setSequence] = useState("");
    const [floors, setFloors] = useState(1);

    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleCreateTerritoryAddress = async (
      event: FormEvent<HTMLElement>
    ) => {
      event.preventDefault();

      if (!isValidPostal(postalCode)) {
        alert("Invalid postal code");
        return;
      }

      if (!isValidPostalSequence(sequence, TERRITORY_TYPES.PUBLIC)) {
        alert("Invalid sequence");
        return;
      }

      const existingPostal = await getDocs(
        query(
          collection(firestore, `congregations/${congregation}/addresses`),
          where("postalCode", "==", postalCode),
          where("territory", "==", territoryId)
        )
      );

      if (!existingPostal.empty) {
        alert("Postal code already exist");
        return;
      }

      try {
        setIsSaving(true);
        const mapRef = await addDoc(
          collection(firestore, `congregations/${congregation}/maps`),
          {
            name: name,
            type: TERRITORY_TYPES.PUBLIC,
            territory: territoryId,
            postalCode: postalCode,
            progress: 0
          }
        );
        const setListing = [] as object[];
        const units = sequence.split(",");
        for (let floor = 1; floor <= floors; floor++) {
          for (const [index, unitNo] of units.entries()) {
            const processedUnitNumber = processPropertyNumber(
              unitNo,
              TERRITORY_TYPES.PUBLIC
            );
            if (!processedUnitNumber) continue;

            setListing.push({
              floor: floor,
              status: STATUS_CODES.DEFAULT,
              type: defaultType,
              note: "",
              nhcount: NOT_HOME_STATUS_CODES.DEFAULT,
              sequence: index,
              territory: territoryId,
              map: mapRef.id,
              number: processedUnitNumber
            });
          }
        }

        await MultiBatchSetter(
          collection(firestore, `congregations/${congregation}/addresses`),
          setListing
        );
        alert(`Created postal address, ${postalCode}.`);
        modal.resolve();
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog> */}
        {/* <Modal.Header>
            <Modal.Title>Create Public Address</Modal.Title>
            <HelpButton link={WIKI_CATEGORIES.CREATE_PUBLIC_ADDRESS} />
          </Modal.Header> */}
        <DialogTitle>Create Public Address</DialogTitle>
        <form onSubmit={handleCreateTerritoryAddress}>
          <DialogContent>
            <p>
              These are governmental owned residential properties that usually
              consist of rental flats.
            </p>
            <GenericInputField
              inputType="number"
              label="Postal Code"
              name="postalcode"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setPostalCode(value);
              }}
              changeValue={postalCode}
              required={true}
              placeholder={
                "Block/Building postal code. Eg, 730801, 752367, etc"
              }
            />
            <GenericInputField
              label="Address Name"
              name="name"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setName(value);
              }}
              changeValue={name}
              required={true}
              placeholder={
                "Block/Building name. Eg, 367, Sembawang Star Crescent"
              }
            />
            <FloorField
              handleChange={(e: Event, value: number | number[]) => {
                // const { value } = e.target as HTMLInputElement;
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
          </DialogContent>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </form>
        {/* </ModalDialog> */}
      </Dialog>
    );
  }
);

export default NewPublicAddress;
