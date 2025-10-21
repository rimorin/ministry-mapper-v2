import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent, useCallback, lazy } from "react";
import { Modal, Form, Collapse } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  USER_ACCESS_LEVELS,
  STATUS_CODES,
  TERRITORY_TYPES,
  NOT_HOME_STATUS_CODES,
  MIN_START_FLOOR
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import {
  latlongInterface,
  SelectProps,
  UpdateAddressStatusModalProps
} from "../../utils/interface";
import DncDateField from "../form/dncdate";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HHNotHomeField from "../form/nothome";
import HHStatusField from "../form/status";
import GenericTextAreaField from "../form/textarea";
import ModalUnitTitle from "../form/title";
import HHTypeField from "../form/household";
import ComponentAuthorizer from "../navigation/authorizer";
import DateFormat from "../../utils/helpers/dateformat";
import { updateDataById, callFunction } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";
import GenericButton from "../navigation/button";
const ChangeMapGeolocation = lazy(() => import("./changegeolocation"));

const UpdateUnitStatus = NiceModal.create(
  ({ addressData, unitDetails, policy }: UpdateAddressStatusModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();
    const { showModal } = useModalManagement();

    const unitNumber = unitDetails?.number || "";
    const unitFloor = unitDetails?.floor || MIN_START_FLOOR;
    const mapId = addressData?.id || "";
    const addressName = addressData?.name || "";
    const addressType = addressData?.type;
    const addressId = unitDetails?.id || "";
    const status = unitDetails?.status;
    const isSingleStory = addressType === TERRITORY_TYPES.SINGLE_STORY;

    // DRY: Extract coordinate validation logic
    const hasValidCoordinates = (
      coords: latlongInterface | undefined
    ): coords is latlongInterface => !!coords && !!coords.lat && !!coords.lng;

    const defaultCoordinates = unitDetails?.coordinates;
    const validDefaultCoords = hasValidCoordinates(defaultCoordinates)
      ? defaultCoordinates
      : undefined;

    const [isNotHome, setIsNotHome] = useState(
      status === STATUS_CODES.NOT_HOME
    );
    const [isDnc, setIsDnc] = useState(status === STATUS_CODES.DO_NOT_CALL);
    const [isSaving, setIsSaving] = useState(false);
    const [hhType, setHhtype] = useState(unitDetails?.type);
    const [unitStatus, setUnitStatus] = useState(status);
    const [hhDnctime, setHhDnctime] = useState<number | undefined>(
      unitDetails?.dnctime
    );
    const [hhNhcount, setHhNhcount] = useState(unitDetails?.nhcount.toString());
    const [hhNote, setHhNote] = useState(unitDetails?.note);
    const [coordinates, setCoordinates] = useState(validDefaultCoords);
    const [location, setLocation] = useState(
      validDefaultCoords
        ? `${validDefaultCoords.lat}, ${validDefaultCoords.lng}`
        : ""
    );

    const handleDeleteProperty = useCallback(async () => {
      setIsSaving(true);
      try {
        await callFunction("/map/code/delete", {
          method: "POST",
          body: {
            map: mapId,
            code: unitNumber
          }
        });
        modal.hide();
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsSaving(false);
      }
    }, [mapId, unitNumber]);

    const handleSubmitClick = useCallback(
      async (event: FormEvent<HTMLElement>) => {
        event.preventDefault();
        const updateData = {
          type: hhType?.map((type) => type.id) || [],
          notes: hhNote || "",
          status: unitStatus || STATUS_CODES.DEFAULT,
          not_home_tries: hhNhcount ? parseInt(hhNhcount) : 0,
          dnc_time: hhDnctime ? new Date(hhDnctime).toISOString() : "",
          coordinates: coordinates ? JSON.stringify(coordinates) : "",
          updated_by: policy.userName
        };

        try {
          setIsSaving(true);
          await updateDataById("addresses", addressId, updateData, {
            requestKey: `update-address-${addressId}`
          });
          modal.hide();
        } catch (error) {
          errorHandler(error);
        } finally {
          setIsSaving(false);
        }
      },
      [
        hhType,
        hhNote,
        unitStatus,
        hhNhcount,
        hhDnctime,
        coordinates,
        addressId,
        policy.userName
      ]
    );

    const handleMapCoordinatesClick = useCallback(async () => {
      const result = await showModal(ChangeMapGeolocation, {
        coordinates: coordinates || addressData?.coordinates,
        isSelectOnly: true,
        origin: policy.origin,
        name: addressName
      });
      const newCoordinates = result as latlongInterface;
      if (newCoordinates) {
        setLocation(`${newCoordinates.lat}, ${newCoordinates.lng}`);
        setCoordinates(newCoordinates);
      }
    }, [coordinates, addressData?.coordinates, policy.origin, addressName]);

    const handleConfirmDelete = useCallback(() => {
      const confirmDelete = window.confirm(
        t(
          "address.deletePropertyWarning",
          '⚠️ WARNING: Deleting property number "{{number}}" of "{{name}}". This action cannot be undone. Proceed?',
          {
            number: unitNumber,
            name: addressName
          }
        )
      );
      if (confirmDelete) {
        handleDeleteProperty();
      }
    }, [t, unitNumber, addressName, handleDeleteProperty]);

    const handleClearNote = useCallback(() => {
      setHhNote("");
    }, []);

    const handleStatusChange = useCallback((toggleValue: string) => {
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
    }, []);

    const handleNotHomeCountChange = useCallback((toggleValue: string) => {
      setHhNhcount(toggleValue);
    }, []);

    const handleDncDateChange = useCallback((date: unknown) => {
      const dateValue = date as Date;
      setHhDnctime(dateValue.getTime());
    }, []);

    const handleNoteChange = useCallback((e: ChangeEvent<HTMLElement>) => {
      const { value } = e.target as HTMLInputElement;
      setHhNote(value);
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleHHTypeChange = useCallback((option: any) => {
      setHhtype(
        option.map((opt: SelectProps) => {
          return {
            id: opt.value,
            code: opt.label
          };
        })
      );
    }, []);

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <ModalUnitTitle
          unit={unitNumber}
          floor={unitFloor}
          type={addressType}
          name={addressName}
        />
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
            <HHTypeField
              handleChange={handleHHTypeChange}
              changeValue={hhType}
              options={policy.options.map((option) => ({
                label: option.description,
                value: option.id
              }))}
            />
            <div style={{ position: "relative" }}>
              <GenericTextAreaField
                label={t("address.notes", "Notes")}
                name="note"
                handleChange={handleNoteChange}
                changeValue={hhNote}
              />
            </div>
            {isSingleStory && (
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
                // Empty handleChange added to satisfy React's controlled component pattern
                // This input is primarily updated through map selection via handleClick,
                // but React requires an onChange handler when a value prop is provided
                handleChange={() => {}}
                information={t(
                  "address.coordinatesDescription",
                  "Latitude and Longitude of the address."
                )}
                autoComplete="off"
              />
            )}
            {unitDetails?.updated && unitDetails?.updatedBy && (
              <div className="text-center text-muted">
                <small>
                  {t("address.updatedByOn", "Updated by {{user}} on {{date}}", {
                    user: unitDetails?.updatedBy,
                    date: DateFormat(unitDetails?.updated)
                  })}
                </small>
              </div>
            )}
          </Modal.Body>
          <ModalFooter
            handleClick={() => modal.hide()}
            isSaving={isSaving}
            userAccessLevel={policy.userRole}
          >
            {isSingleStory && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={policy.userRole}
              >
                <GenericButton
                  variant="secondary"
                  onClick={handleConfirmDelete}
                  label={t("common.delete", "Delete")}
                />
              </ComponentAuthorizer>
            )}
            {hhNote && (
              <GenericButton
                variant="secondary"
                onClick={handleClearNote}
                label={t("address.clearNote", "Clear Note")}
              />
            )}
          </ModalFooter>
        </Form>
      </Modal>
    );
  }
);

export default UpdateUnitStatus;
