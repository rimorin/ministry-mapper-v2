import NiceModal from "@ebay/nice-modal-react";

import {
  useState,
  FormEvent,
  ChangeEvent,
  lazy,
  useEffect,
  useRef
} from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { MapPin } from "lucide-react";
import {
  USER_ACCESS_LEVELS,
  STATUS_CODES,
  TERRITORY_TYPES,
  NOT_HOME_STATUS_CODES,
  MIN_START_FLOOR
} from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import type {
  latlongInterface,
  SelectProps,
  UpdateAddressStatusModalProps
} from "../../utils/interface";
import DncDateField from "../form/dncdate";
import HHNotHomeField from "../form/nothome";
import HHStatusField from "../form/status";
import GenericTextAreaField from "../form/textarea";
import ModalUnitTitle from "../form/title";
import HHTypeField from "../form/household";
import ComponentAuthorizer from "../navigation/authorizer";
import DateFormat from "../../utils/helpers/dateformat";
import { callFunction } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";
const ChangeMapGeolocation = lazy(() => import("./changegeolocation"));

const hasValidCoordinates = (
  coords: latlongInterface | undefined
): coords is latlongInterface => !!coords && !!coords.lat && !!coords.lng;

const UpdateUnitStatus = NiceModal.create(
  ({
    addressData,
    unitDetails,
    policy,
    writeUpdate,
    onOptimisticUpdate
  }: UpdateAddressStatusModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const { showModal } = useModalManagement();
    const { confirm } = useConfirm();

    const unitNumber = unitDetails?.number || "";
    const mapId = addressData?.id || "";
    const addressName = addressData?.name || "";
    const addressType = addressData?.type;
    const addressId = unitDetails?.id || "";
    const isSingleStory = addressType === TERRITORY_TYPES.SINGLE_STORY;

    const [isSaving, setIsSaving] = useState(false);
    const [hhType, setHhtype] = useState(unitDetails?.type);
    const [showHhTypeError, setShowHhTypeError] = useState(false);
    const [unitStatus, setUnitStatus] = useState(unitDetails?.status);
    const [hhDnctime, setHhDnctime] = useState<number | undefined>(
      unitDetails?.dnctime
    );
    const [hhNhcount, setHhNhcount] = useState(unitDetails?.nhcount.toString());
    const [hhNote, setHhNote] = useState(unitDetails?.note);
    const [coordinates, setCoordinates] = useState(
      hasValidCoordinates(unitDetails?.coordinates)
        ? unitDetails?.coordinates
        : undefined
    );

    const isNotHome = unitStatus === STATUS_CODES.NOT_HOME;
    const isDnc = unitStatus === STATUS_CODES.DO_NOT_CALL;

    // NiceModal reuses the mounted component — reset all form state when a
    // different unit is opened so stale values from the previous unit don't leak.
    useEffect(() => {
      if (!unitDetails) return;
      const s = unitDetails.status;
      const coords = hasValidCoordinates(unitDetails.coordinates)
        ? unitDetails.coordinates
        : undefined;
      setUnitStatus(s);
      setHhtype(unitDetails.type);
      setHhNhcount(unitDetails.nhcount?.toString());
      setHhNote(unitDetails.note);
      setHhDnctime(unitDetails.dnctime);
      setCoordinates(coords);
    }, [unitDetails]);

    const handleDeleteProperty = async () => {
      await runAction(
        async () => {
          await callFunction("/map/code/delete", {
            method: "POST",
            body: { map: mapId, code: unitNumber }
          });
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    const hasOptions = policy.options.length > 0;
    const isHhTypeValid = !hasOptions || (hhType?.length ?? 0) > 0;

    const handleSubmitClick = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      if (!isHhTypeValid) {
        setShowHhTypeError(true);
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
          await writeUpdate({
            addressId,
            mapId,
            congregation: policy.congregation,
            updateData,
            initialTypes: unitDetails?.type ?? [],
            desiredTypes: hhType ?? [],
            onOptimistic: () =>
              onOptimisticUpdate?.(addressId, updateData, hhType ?? [])
          });
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    const handleMapCoordinatesClick = async () => {
      const result = await showModal(ChangeMapGeolocation, {
        coordinates: coordinates || addressData?.coordinates,
        isSelectOnly: true,
        origin: policy.origin,
        name: addressName
      });
      const newCoordinates = result as latlongInterface;
      if (newCoordinates) {
        setCoordinates(newCoordinates);
      }
    };

    const handleConfirmDelete = async () => {
      const confirmDelete = await confirm({
        title: t("common.confirmDelete", "Confirm Delete"),
        message: t(
          "address.deletePropertyWarning",
          'Property "{{number}}" will be permanently deleted from "{{name}}".\nYou cannot undo this.',
          {
            number: unitNumber,
            name: addressName
          }
        ),
        confirmText: t("common.delete", "Delete"),
        variant: "danger"
      });
      if (confirmDelete) {
        handleDeleteProperty();
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

    const handleNoteChange = (e: ChangeEvent<HTMLElement>) => {
      const { value } = e.target as HTMLInputElement;
      setHhNote(value);
    };

    const handleHHTypeChange = (option: SelectProps[]) => {
      setShowHhTypeError(false);
      setHhtype(
        option.map((opt: SelectProps) => ({
          id: opt.value,
          code:
            policy.options.find((o) => o.id === opt.value)?.code ?? opt.label
        }))
      );
    };

    const focusTrapRef = useRef<HTMLSpanElement>(null);

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          className={cn(
            contentProps.className,
            "flex h-[min(85dvh,600px)] max-h-[85dvh] flex-col"
          )}
          initialFocus={focusTrapRef}
        >
          {/* Hidden focus trap: FloatingFocusManager focuses this instead of the first toggle */}
          <span ref={focusTrapRef} tabIndex={-1} inert className="sr-only" />
          <ModalUnitTitle
            unit={unitNumber}
            floor={unitDetails?.floor || MIN_START_FLOOR}
            type={addressType}
            name={addressName}
          />
          <HHStatusField
            handleGroupChange={handleStatusChange}
            changeValue={unitStatus}
            nhcount={isNotHome ? hhNhcount : undefined}
          />
          <form
            onSubmit={handleSubmitClick}
            className="flex min-h-0 flex-1 flex-col gap-3"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-1">
              {isDnc && (
                <DncDateField
                  changeDate={hhDnctime}
                  handleDateChange={(date) => setHhDnctime(date.getTime())}
                />
              )}
              {isNotHome && (
                <HHNotHomeField
                  changeValue={hhNhcount}
                  handleGroupChange={setHhNhcount}
                />
              )}
              <HHTypeField
                handleChange={handleHHTypeChange}
                changeValue={hhType}
                options={policy.options.map((option) => ({
                  label: option.description,
                  value: option.id
                }))}
                error={
                  showHhTypeError
                    ? t(
                        "household.required",
                        "Please select at least one household type."
                      )
                    : undefined
                }
              />
              <GenericTextAreaField
                label={t("address.notes", "Notes")}
                name="note"
                handleChange={handleNoteChange}
                changeValue={hhNote}
                onClear={() => setHhNote("")}
                textareaClassName="min-h-24"
                information={t(
                  "address.notesInformation",
                  "Property notes only. No personal information."
                )}
              />
              {isSingleStory && (
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("address.coordinates", "Address Coordinates")}
                  </Label>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-start font-normal"
                    onClick={handleMapCoordinatesClick}
                  >
                    <MapPin className="size-4 text-muted-foreground shrink-0" />
                    <span
                      className={coordinates ? "" : "text-muted-foreground"}
                    >
                      {coordinates
                        ? `${coordinates.lat}, ${coordinates.lng}`
                        : t(
                            "address.clickToSelectOnMap",
                            "Click to select on map"
                          )}
                    </span>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "address.coordinatesDescription",
                      "Latitude and Longitude of the address."
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {unitDetails?.updated && unitDetails?.updatedBy && (
                <p className="text-center text-xs text-muted-foreground">
                  {t("address.updatedByOn", "Updated by {{user}} on {{date}}", {
                    user: unitDetails?.updatedBy,
                    date: DateFormat(unitDetails?.updated)
                  })}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  className="flex-1"
                  onClick={() => modal.hide()}
                >
                  {t("common.cancel")}
                </Button>
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                  userPermission={policy.userRole}
                >
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving && (
                      <Spinner data-icon="inline-start" aria-hidden="true" />
                    )}
                    {t("common.save")}
                  </Button>
                </ComponentAuthorizer>
              </div>
              {isSingleStory && (
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={policy.userRole}
                >
                  <>
                    <Separator />
                    <Button
                      variant="destructive"
                      type="button"
                      className="w-full"
                      onClick={handleConfirmDelete}
                    >
                      {t("common.delete", "Delete")}
                    </Button>
                  </>
                </ComponentAuthorizer>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default UpdateUnitStatus;
