import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { doc, updateDoc } from "firebase/firestore";
import { useState, FormEvent, ChangeEvent, lazy, forwardRef } from "react";
import ModalManager from "@ebay/nice-modal-react";

import { firestore } from "../../firebase";
import {
  USER_ACCESS_LEVELS,
  STATUS_CODES,
  TERRITORY_TYPES,
  NOT_HOME_STATUS_CODES,
  DEFAULT_MULTPLE_OPTION_DELIMITER
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import processPostalUnitNumber from "../../utils/helpers/processpostalno";
import { UpdateAddressStatusModalProps } from "../../utils/interface";
import DncDateField from "../form/dncdate";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HHNotHomeField from "../form/nothome";
import HHStatusField from "../form/status";
import GenericTextAreaField from "../form/textarea";
import ModalUnitTitle from "../form/title";
import HHTypeField from "../form/household";
import ComponentAuthorizer from "../navigation/authorizer";
import GetDirection from "../../utils/helpers/directiongenerator";
// import {
//   Button,
//   DialogContent,
//   Divider,
//   Modal,
//   ModalDialog,
//   Stack
// } from "@mui/joy";
import SuspenseComponent from "../utils/suspense";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  Divider,
  Slide,
  Stack
} from "@mui/material";
import { TransitionProps } from "react-transition-group/Transition";
const ConfirmationDialog = SuspenseComponent(
  lazy(() => import("../../components/modal/confirmation"))
);
// const TransitionedDncDateField = withTransition(DncDateField);
// const TransitionedHHNotHomeField = withTransition(HHNotHomeField);

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UpdateUnitStatus = NiceModal.create(
  ({
    congregation,
    addressName,
    userAccessLevel = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    territoryType,
    postalCode,
    unitNo,
    unitNoDisplay,
    addressData,
    floorDisplay,
    unitDetails,
    options,
    defaultOption,
    isMultiselect,
    addressId,
    updatedBy
  }: UpdateAddressStatusModalProps) => {
    const status = unitDetails?.status;
    const [isNotHome, setIsNotHome] = useState(
      status === STATUS_CODES.NOT_HOME
    );
    const [isDnc, setIsDnc] = useState(status === STATUS_CODES.DO_NOT_CALL);
    const [hhType, setHhtype] = useState(unitDetails?.type);
    const [unitStatus, setUnitStatus] = useState(status);
    const [hhDnctime, setHhDnctime] = useState<number | undefined>(
      unitDetails?.dnctime
    );
    const [hhPropertyPostal, setHhPropertyPostal] = useState<
      string | undefined
    >(unitDetails?.propertyPostal);
    const [hhNhcount, setHhNhcount] = useState(unitDetails?.nhcount);
    const [hhNote, setHhNote] = useState(unitDetails?.note);
    const [unitSequence, setUnitSequence] = useState<undefined | number>(
      unitDetails?.sequence
    );
    const modal = useModal();
    const rollbar = useRollbar();

    const handleSubmitClick = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      const updateData: {
        type: string | undefined;
        note: string | undefined;
        status: number | undefined;
        nhcount: number | undefined;
        dnctime: number | string;
        sequence?: number;
        postalCode?: string;
        updatedBy?: string;
        updatedOn?: number;
      } = {
        type: hhType as string,
        note: hhNote || "",
        status: unitStatus,
        nhcount: hhNhcount || 0,
        dnctime: hhDnctime || 0,
        updatedBy: updatedBy || "",
        updatedOn: new Date().getTime()
      };
      // Include sequence update value only when administering private territories
      const administeringPrivate =
        territoryType === TERRITORY_TYPES.PRIVATE &&
        userAccessLevel === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;
      if (administeringPrivate && unitSequence) {
        updateData.sequence = Number(unitSequence);
      }
      if (administeringPrivate && hhPropertyPostal) {
        updateData.postalCode = hhPropertyPostal;
      }
      try {
        updateDoc(
          doc(firestore, `congregations/${congregation}/addresses`, addressId),
          updateData
        );
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      }
    };
    return (
      <Dialog
        open={modal.visible}
        onClose={() => modal.hide()}
        TransitionComponent={Transition}
        keepMounted
        onTransitionExited={() => {
          modal.remove();
        }}
      >
        <ModalUnitTitle
          unit={unitNoDisplay}
          propertyPostal={unitDetails?.propertyPostal}
          floorDisplay={floorDisplay as string}
          postal={postalCode}
          type={territoryType}
          name={addressName || ""}
        />
        <Divider />
        <DialogContent>
          <Stack spacing={1}>
            <HHStatusField
              handleGroupChange={(event, value) => {
                if (!value) return;
                const toggleValue = Number(value);
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
              }}
              changeValue={unitStatus}
            />
            <Collapse in={isDnc}>
              <Box sx={{ height: 320 }}>
                <DncDateField
                  changeDate={hhDnctime}
                  handleDateChange={(date) => {
                    setHhDnctime(date.getTime());
                  }}
                />
              </Box>
            </Collapse>
            <Collapse in={isNotHome}>
              <HHNotHomeField
                changeValue={hhNhcount}
                handleGroupChange={(_, toggleValue) => {
                  setHhNhcount(Number(toggleValue));
                }}
              ></HHNotHomeField>
            </Collapse>
            <HHTypeField
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              handleChange={(event: any) => {
                const {
                  target: { value }
                } = event;
                // if (isMultiselect) {
                //   const values: string[] = [];
                //   value.forEach((opt: SelectProps) => {
                //     values.push(opt.value);
                //   });
                //   setHhtype(values.join(DEFAULT_MULTPLE_OPTION_DELIMITER));
                //   return;
                // }
                setHhtype(
                  typeof value === "string"
                    ? value
                    : value.join(DEFAULT_MULTPLE_OPTION_DELIMITER)
                );
              }}
              changeValue={hhType}
              options={options.map((option) => ({
                value: option.code,
                label: option.description
              }))}
              isMultiselect={isMultiselect}
            />
            <GenericTextAreaField
              label="Notes"
              name="note"
              placeholder="Optional non-personal information. Eg, Renovation, Foreclosed, Friends, etc."
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setHhNote(value);
              }}
              changeValue={hhNote}
            />
            {territoryType === TERRITORY_TYPES.PRIVATE && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={userAccessLevel}
              >
                <>
                  <GenericInputField
                    inputType="number"
                    label="Territory Sequence"
                    name="sequence"
                    handleChange={(e: ChangeEvent<HTMLElement>) => {
                      const { value } = e.target as HTMLInputElement;
                      const parsedValue = parseInt(value);
                      setUnitSequence(
                        isNaN(parsedValue) ? undefined : parsedValue
                      );
                    }}
                    changeValue={unitSequence}
                  />
                  <GenericInputField
                    inputType="string"
                    label="Property Postal"
                    name="propertyPostal"
                    placeholder="Optional postal code for direction to this property"
                    handleChange={(e: ChangeEvent<HTMLElement>) => {
                      const { value } = e.target as HTMLInputElement;
                      setHhPropertyPostal(value);
                    }}
                    changeValue={hhPropertyPostal}
                  />
                </>
              </ComponentAuthorizer>
            )}
          </Stack>
        </DialogContent>
        <form
          onSubmit={handleSubmitClick}
          style={{ width: "100%", height: "100%" }}
        >
          <ModalFooter
            handleClick={() => modal.hide()}
            userAccessLevel={userAccessLevel}
          >
            {territoryType && territoryType === TERRITORY_TYPES.PRIVATE ? (
              <>
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={userAccessLevel}
                >
                  <Button
                    onClick={() => {
                      ModalManager.show(ConfirmationDialog, {
                        message: `Are you sure you want to delete this property?`
                      }).then((result) => {
                        if (result) {
                          processPostalUnitNumber(
                            congregation,
                            postalCode,
                            unitNo,
                            addressData,
                            true,
                            defaultOption
                          );
                        }
                      });
                    }}
                  >
                    Delete
                  </Button>
                </ComponentAuthorizer>
                {hhPropertyPostal && (
                  <Button
                    // variant="secondary"
                    onClick={() =>
                      window.open(
                        GetDirection(encodeURIComponent(hhPropertyPostal)),
                        "_blank"
                      )
                    }
                  >
                    Direction
                  </Button>
                )}
              </>
            ) : (
              <></>
            )}
          </ModalFooter>
        </form>
      </Dialog>
    );
  }
);

export default UpdateUnitStatus;
