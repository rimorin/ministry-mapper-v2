import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, FormEvent, ChangeEvent, lazy } from "react";
import { Modal, Form, Collapse } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  STATUS_CODES,
  NOT_HOME_STATUS_CODES,
  MIN_START_FLOOR,
  ADDRESS_CREATE_SOURCE
} from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import {
  latlongInterface,
  SelectProps,
  typeInterface,
  CreateAddressModalProps
} from "../../utils/interface";
import DncDateField from "../form/dncdate";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HHNotHomeField from "../form/nothome";
import HHStatusField from "../form/status";
import GenericTextAreaField from "../form/textarea";
import HHTypeField from "../form/household";
import { createData, createBatch } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";
import { sanitizePropertyCode } from "../../utils/helpers/processpropertyno";
import { MultiValue } from "react-select";
const ChangeMapGeolocation = lazy(() => import("./changegeolocation"));

const CreateAddress = NiceModal.create(
  ({
    addressData,
    policy,
    sequence,
    existingCodes,
    territoryId
  }: CreateAddressModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const { showModal } = useModalManagement();

    const mapId = addressData.id;
    const addressName = addressData.name;
    const addressType = addressData.type;

    const [isNotHome, setIsNotHome] = useState(false);
    const [isDnc, setIsDnc] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hhType, setHhtype] = useState<typeInterface[] | undefined>(
      undefined
    );
    const [unitStatus, setUnitStatus] = useState(STATUS_CODES.DEFAULT);
    const [hhDnctime, setHhDnctime] = useState<number | undefined>(undefined);
    const [hhNhcount, setHhNhcount] = useState(NOT_HOME_STATUS_CODES.DEFAULT);
    const [hhNote, setHhNote] = useState("");
    const [coordinates, setCoordinates] = useState<
      latlongInterface | undefined
    >(undefined);
    const [location, setLocation] = useState("");
    const [propertyNumber, setPropertyNumber] = useState("");

    const handleSubmitClick = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (existingCodes.has(propertyNumber)) {
        notifyError(
          t(
            "address.duplicateCode",
            "Address {{code}} already exists in this territory map.",
            { code: propertyNumber }
          )
        );
        return;
      }

      try {
        setIsSaving(true);
        const userName = policy.userName;
        const newAddress = await createData("addresses", {
          map: mapId,
          territory: territoryId,
          code: propertyNumber,
          status: unitStatus || STATUS_CODES.DEFAULT,
          notes: hhNote || "",
          not_home_tries: hhNhcount ? parseInt(hhNhcount) : 0,
          dnc_time: hhDnctime ? new Date(hhDnctime).toISOString() : "",
          coordinates: coordinates ? JSON.stringify(coordinates) : "",
          floor: MIN_START_FLOOR,
          sequence,
          congregation: policy.congregation,
          updated_by: userName,
          created_by: userName,
          source: ADDRESS_CREATE_SOURCE
        });

        if (hhType && hhType.length > 0) {
          const batch = createBatch();
          hhType.forEach((t) =>
            batch.collection("address_options").create({
              address: newAddress.id,
              option: t.id,
              congregation: policy.congregation,
              map: mapId
            })
          );
          await batch.send();
        }

        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleMapCoordinatesClick = async () => {
      const result = await showModal(ChangeMapGeolocation, {
        coordinates: coordinates || addressData.coordinates,
        isSelectOnly: true,
        origin: policy.origin,
        name: addressName
      });
      const newCoordinates = result as latlongInterface;
      if (newCoordinates) {
        setLocation(`${newCoordinates.lat}, ${newCoordinates.lng}`);
        setCoordinates(newCoordinates);
      }
    };

    const handleStatusChange = (toggleValue: string) => {
      let dnctime = undefined;
      setIsNotHome(false);
      setIsDnc(false);
      if (toggleValue === STATUS_CODES.NOT_HOME) {
        setIsNotHome(true);
      } else if (toggleValue === STATUS_CODES.DO_NOT_CALL) {
        setIsDnc(true);
        dnctime = new Date().getTime();
      }
      setHhNhcount(NOT_HOME_STATUS_CODES.DEFAULT);
      setHhDnctime(dnctime);
      setUnitStatus(toggleValue);
    };

    const handleNotHomeCountChange = (toggleValue: string) => {
      setHhNhcount(toggleValue);
    };

    const handleDncDateChange = (date: unknown) => {
      const dateValue = date as Date;
      setHhDnctime(dateValue.getTime());
    };

    const handleNoteChange = (e: ChangeEvent<HTMLElement>) => {
      const { value } = e.target as HTMLInputElement;
      setHhNote(value);
    };

    const handlePropertyNumberChange = (e: ChangeEvent<HTMLElement>) => {
      const { value } = e.target as HTMLInputElement;
      setPropertyNumber(sanitizePropertyCode(value));
    };

    const handleHHTypeChange = (option: MultiValue<SelectProps>) => {
      setHhtype(
        option.map((opt: SelectProps) => ({ id: opt.value, code: opt.label }))
      );
    };

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {t("address.createAddress", "Add address to {{name}}", {
              name: addressName
            })}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitClick}>
          <Modal.Body
            style={{
              maxHeight: "70dvh",
              overflowY: "auto"
            }}
          >
            <HHStatusField
              handleGroupChange={handleStatusChange}
              changeValue={unitStatus}
            />
            <Collapse in={isDnc}>
              <div className="text-center">
                <DncDateField
                  changeDate={hhDnctime}
                  handleDateChange={handleDncDateChange}
                />
              </div>
            </Collapse>
            <Collapse in={isNotHome}>
              <div className="text-center">
                <HHNotHomeField
                  changeValue={hhNhcount}
                  handleGroupChange={handleNotHomeCountChange}
                />
              </div>
            </Collapse>
            <GenericInputField
              label={t("address.propertyNumber", "Property Number")}
              name="propertyNumber"
              handleChange={handlePropertyNumberChange}
              changeValue={propertyNumber}
              required={true}
              autoComplete="off"
              placeholder={t(
                "address.propertyNumberPlaceholder",
                "e.g. 1, 2A, B3"
              )}
            />
            <HHTypeField
              handleChange={handleHHTypeChange}
              changeValue={hhType}
              options={policy.options.map((option) => ({
                label: option.description,
                value: option.id
              }))}
            />
            <GenericTextAreaField
              label={t("address.notes", "Notes")}
              name="note"
              handleChange={handleNoteChange}
              changeValue={hhNote}
              information={t(
                "address.notesInformation",
                "Property notes only. No personal information."
              )}
            />
            {addressType && (
              <GenericInputField
                label={t("address.coordinates", "Address Coordinates")}
                name="location"
                placeholder={t(
                  "address.clickToSelectOnMap",
                  "Click to select on map"
                )}
                handleClick={handleMapCoordinatesClick}
                changeValue={location}
                required={false}
                handleChange={() => {}}
                information={t(
                  "address.coordinatesDescription",
                  "Latitude and Longitude of the address."
                )}
                autoComplete="off"
              />
            )}
          </Modal.Body>
          <ModalFooter
            handleClick={() => modal.hide()}
            isSaving={isSaving}
            userAccessLevel={policy.userRole}
            submitLabel={t("common.create", "Create")}
          />
        </Form>
      </Modal>
    );
  }
);

export default CreateAddress;
