import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import {
  USER_ACCESS_LEVELS,
  TERRITORY_TYPES,
  WIKI_CATEGORIES
} from "../../utils/constants";
import processPostalUnitNumber from "../../utils/helpers/processpostalno";
import errorHandler from "../../utils/helpers/errorhandler";
import { NewUnitModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import { DialogContent, DialogTitle, Modal, ModalDialog } from "@mui/joy";

const NewUnit = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    addressData,
    addressName,
    defaultType,
    congregation
  }: NewUnitModalProps) => {
    const [unit, setUnit] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const handleCreateNewUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        processPostalUnitNumber(
          congregation,
          mapId,
          unit,
          addressData,
          false,
          defaultType
        );
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal open={modal.visible} onClose={() => modal.hide()}>
        <ModalDialog>
          <DialogTitle>
            {`Add ${
              addressData.type === TERRITORY_TYPES.PRIVATE ? "property" : "unit"
            } to ${addressName}`}
          </DialogTitle>
          <form onSubmit={handleCreateNewUnit}>
            <DialogContent>
              <GenericInputField
                label={`${
                  addressData.type === TERRITORY_TYPES.PRIVATE
                    ? "Property"
                    : "Unit"
                } number`}
                name="unit"
                handleChange={(e: ChangeEvent<HTMLElement>) => {
                  const { value } = e.target as HTMLInputElement;
                  setUnit(value);
                }}
                changeValue={unit}
                required={true}
              />
            </DialogContent>
            <ModalFooter
              handleClick={modal.hide}
              userAccessLevel={footerSaveAcl}
              isSaving={isSaving}
              submitLabel="Add"
            />
          </form>
        </ModalDialog>
      </Modal>
    );
  }
);

export default NewUnit;
