import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  STATUS_CODES,
  NOT_HOME_STATUS_CODES,
  WIKI_CATEGORIES
} from "../../utils/constants";
import isValidPostal from "../../utils/helpers/checkvalidpostal";
import isValidPostalSequence from "../../utils/helpers/checkvalidseq";
import processPropertyNumber from "../../utils/helpers/processpropertyno";
import errorHandler from "../../utils/helpers/errorhandler";
import { NewPrivateAddressModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import GenericTextAreaField from "../form/textarea";
import HelpButton from "../navigation/help";
import { firestore } from "../../firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import MultiBatchSetter from "../../utils/helpers/multibatchcreate";
import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const NewPrivateAddress = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    defaultType,
    territoryId
  }: NewPrivateAddressModalProps) => {
    const [postalCode, setPostalCode] = useState("");
    const [name, setName] = useState("");
    const [sequence, setSequence] = useState("");
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

      const existingPostal = await getDocs(
        query(
          collection(firestore, `congregations/${congregation}/addresses`),
          where("postalCode", "==", postalCode),
          where("territoryId", "==", territoryId)
        )
      );

      if (!existingPostal.empty) {
        alert("Postal code already exist");
        return;
      }

      if (!isValidPostalSequence(sequence, TERRITORY_TYPES.PRIVATE)) {
        alert("Invalid sequence");
        return;
      }
      try {
        setIsSaving(true);
        const units = sequence.split(",");
        const mapRef = await addDoc(
          collection(firestore, `congregations/${congregation}/maps`),
          {
            name: name,
            type: TERRITORY_TYPES.PRIVATE,
            territory: territoryId,
            postalCode: postalCode,
            progress: 0
          }
        );
        const setListing = [] as object[];

        for (const [index, unitNo] of units.entries()) {
          const processedUnitNumber = processPropertyNumber(
            unitNo,
            TERRITORY_TYPES.PRIVATE
          );
          if (!processedUnitNumber) continue;

          setListing.push({
            floor: 1,
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

        await MultiBatchSetter(
          collection(firestore, `congregations/${congregation}/addresses`),
          setListing
        );

        alert(`Created private address, ${postalCode}.`);
        modal.resolve();
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal open={modal.visible} onClose={() => modal.hide()}>
        {/* <Modal.Header>
          <Modal.Title>Create Private Address</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CREATE_PRIVATE_ADDRESS} />
        </Modal.Header> */}
        <ModalDialog>
          <DialogTitle>Create Private Address</DialogTitle>
          <form onSubmit={handleCreateTerritoryAddress}>
            <DialogContent>
              <p>
                These are non-governmental owned residential properties such as
                terrace houses, semi-detached houses, bungalows or cluster
                houses.
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
                placeholder={"Estate postal code"}
                information="A postal code within the private estate. This code will be used for locating the estate."
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
                placeholder={"For eg, Sembawang Boulevard Crescent"}
              />
              <GenericTextAreaField
                label="House Sequence"
                name="units"
                placeholder="House sequence with comma seperator. For eg, 1A,1B,2A ..."
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
        </ModalDialog>
      </Modal>
    );
  }
);

export default NewPrivateAddress;
