import NiceModal from "@ebay/nice-modal-react";
import { useState, FormEvent, ChangeEvent, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  USER_ACCESS_LEVELS,
  STATUS_CODES,
  NOT_HOME_STATUS_CODES,
  MIN_START_FLOOR,
  ADDRESS_CREATE_SOURCE
} from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import type {
  latlongInterface,
  SelectProps,
  typeInterface,
  CreateAddressModalProps
} from "../../utils/interface";
import DncDateField from "../form/dncdate";
import GenericInputField from "../form/input";
import HHNotHomeField from "../form/nothome";
import HHStatusField from "../form/status";
import GenericTextAreaField from "../form/textarea";
import HHTypeField from "../form/household";
import { useModalManagement } from "../../hooks/useModalManagement";
import { sanitizePropertyCode } from "../../utils/helpers/processpropertyno";
import ComponentAuthorizer from "../navigation/authorizer";
const ChangeMapGeolocation = lazy(() => import("./changegeolocation"));

const CreateAddress = NiceModal.create(
  ({
    addressData,
    policy,
    sequence,
    existingCodes,
    territoryId,
    writeCreate,
    onOptimisticCreate
  }: CreateAddressModalProps) => {
    const { modal, hide, dialogProps, contentProps } = useBaseUiDialog();
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const { showModal } = useModalManagement();

    const mapId = addressData.id;
    const addressName = addressData.name;
    const addressType = addressData.type;

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
    const [propertyNumber, setPropertyNumber] = useState("");

    const isNotHome = unitStatus === STATUS_CODES.NOT_HOME;
    const isDnc = unitStatus === STATUS_CODES.DO_NOT_CALL;

    const handleSubmitClick = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (existingCodes.has(propertyNumber)) {
        notifyWarning(
          t(
            "address.duplicateCode",
            "Address {{code}} already exists in this territory map.",
            { code: propertyNumber }
          )
        );
        return;
      }

      const updateData = {
        notes: hhNote || "",
        status: unitStatus || STATUS_CODES.DEFAULT,
        not_home_tries: hhNhcount ? parseInt(hhNhcount) : 0,
        dnc_time: hhDnctime ? new Date(hhDnctime).toISOString() : "",
        coordinates: coordinates ? JSON.stringify(coordinates) : null
      };
      await runAction(
        async () => {
          await writeCreate({
            mapId,
            congregation: policy.congregation,
            createPayload: {
              map: mapId,
              territory: territoryId,
              code: propertyNumber,
              floor: MIN_START_FLOOR,
              sequence,
              congregation: policy.congregation,
              source: ADDRESS_CREATE_SOURCE
            },
            updateData,
            desiredTypes: hhType ?? [],
            onOptimistic: onOptimisticCreate
              ? (clientId) =>
                  onOptimisticCreate({
                    id: clientId,
                    number: propertyNumber,
                    note: updateData.notes,
                    status: updateData.status,
                    nhcount: String(updateData.not_home_tries),
                    dnctime: updateData.dnc_time
                      ? Date.parse(updateData.dnc_time)
                      : 0,
                    floor: MIN_START_FLOOR,
                    sequence,
                    coordinates,
                    type: hhType ?? []
                  })
              : undefined
          });
          hide();
        },
        { setLoading: setIsSaving }
      );
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
        setCoordinates(newCoordinates);
      }
    };

    const handleStatusChange = (toggleValue: string) => {
      let dnctime = undefined;
      if (toggleValue === STATUS_CODES.DO_NOT_CALL) {
        dnctime = new Date().getTime();
      }
      setHhNhcount(NOT_HOME_STATUS_CODES.DEFAULT);
      setHhDnctime(dnctime);
      setUnitStatus(toggleValue);
    };

    const handleNotHomeCountChange = (toggleValue: string) => {
      setHhNhcount(toggleValue);
    };

    const handleDncDateChange = (date: Date) => {
      setHhDnctime(date.getTime());
    };

    const handleNoteChange = (e: ChangeEvent<HTMLElement>) => {
      const { value } = e.target as HTMLInputElement;
      setHhNote(value);
    };

    const handlePropertyNumberChange = (e: ChangeEvent<HTMLElement>) => {
      const { value } = e.target as HTMLInputElement;
      setPropertyNumber(sanitizePropertyCode(value));
    };

    const handleHHTypeChange = (option: SelectProps[]) => {
      setHhtype(
        option.map((opt: SelectProps) => ({ id: opt.value, code: opt.label }))
      );
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          className={cn(contentProps.className, "flex flex-col h-[65dvh]")}
        >
          <DialogHeader>
            <DialogTitle>
              {t("address.createAddress", "Add address to {{name}}", {
                name: addressName
              })}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitClick}
            className="flex flex-col flex-1 min-h-0 space-y-3"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 px-1 py-1">
                <HHStatusField
                  handleGroupChange={handleStatusChange}
                  changeValue={unitStatus}
                />
                {isDnc && (
                  <div className="text-center">
                    <DncDateField
                      changeDate={hhDnctime}
                      handleDateChange={handleDncDateChange}
                    />
                  </div>
                )}
                {isNotHome && (
                  <div className="text-center">
                    <HHNotHomeField
                      changeValue={hhNhcount}
                      handleGroupChange={handleNotHomeCountChange}
                    />
                  </div>
                )}
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
                    changeValue={
                      coordinates
                        ? `${coordinates.lat}, ${coordinates.lng}`
                        : ""
                    }
                    information={t(
                      "address.coordinatesDescription",
                      "Latitude and Longitude of the address."
                    )}
                    readOnly={true}
                    autoComplete="off"
                  />
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => modal.hide()}
              >
                {t("common.cancel")}
              </Button>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                userPermission={policy.userRole}
              >
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t("common.create", "Create")}
                </Button>
              </ComponentAuthorizer>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default CreateAddress;
