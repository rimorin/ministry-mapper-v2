import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent, useCallback } from "react";
import {
  Modal,
  Form,
  Collapse,
  Container,
  Card,
  Button
} from "react-bootstrap";
import { confirmAlert } from "react-confirm-alert";
import { pb } from "../../utils/pocketbase";
import {
  USER_ACCESS_LEVELS,
  STATUS_CODES,
  TERRITORY_TYPES,
  NOT_HOME_STATUS_CODES,
  WIKI_CATEGORIES,
  PH_STATUS_KEYS
} from "../../utils/constants";
import ModalManager from "@ebay/nice-modal-react";
import errorHandler from "../../utils/helpers/errorhandler";
import {
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
import HelpButton from "../navigation/help";
import ChangeMapGeolocation from "./changegeolocation";
import { usePostHog } from "posthog-js/react";

const UpdateUnitStatus = NiceModal.create(
  ({
    addressData,
    unitDetails,
    origin,
    policy
  }: UpdateAddressStatusModalProps) => {
    const status = unitDetails?.status;
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
    const [unitSequence, setUnitSequence] = useState<number>(
      unitDetails?.sequence
    );
    const defaultCoordinates = unitDetails?.coordinates;
    const [coordinates, setCoordinates] = useState(
      defaultCoordinates && defaultCoordinates.lat && defaultCoordinates.lng
        ? defaultCoordinates
        : undefined
    );
    const [location, setLocation] = useState(
      defaultCoordinates && defaultCoordinates.lat && defaultCoordinates.lng
        ? `${defaultCoordinates?.lat}, ${defaultCoordinates?.lng}`
        : ""
    );
    const modal = useModal();
    const rollbar = useRollbar();
    const posthog = usePostHog();

    const handleDeleteProperty = useCallback(async () => {
      setIsSaving(true);
      try {
        await pb.collection("addresses").delete(unitDetails?.id as string);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    }, []);

    const handleSubmitClick = useCallback(
      async (event: FormEvent<HTMLElement>) => {
        event.preventDefault();
        const updateData = {
          type: hhType?.map((type) => type.id) || [],
          notes: hhNote || "",
          status: unitStatus || STATUS_CODES.DEFAULT,
          not_home_tries: hhNhcount ? parseInt(hhNhcount) : 0,
          dnc_time: hhDnctime ? new Date(hhDnctime).toISOString() : "",
          sequence: unitSequence,
          coordinates: coordinates ? JSON.stringify(coordinates) : "",
          updated_by: policy.userName
        };

        try {
          setIsSaving(true);
          await pb.collection("addresses").update(unitDetails?.id, updateData);
          const updatedStatusType = updateData.status as string;
          if (updatedStatusType !== status) {
            posthog?.capture(
              PH_STATUS_KEYS[updatedStatusType] || PH_STATUS_KEYS.DEFAULT,
              {
                mapId: addressData?.id,
                publisherName: policy.userName,
                ...updateData
              }
            );
          }
          modal.hide();
        } catch (error) {
          errorHandler(error, rollbar);
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
        unitSequence,
        coordinates
      ]
    );
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <ModalUnitTitle
          unit={unitDetails?.number || ""}
          propertyPostal={addressData?.mapId}
          floor={unitDetails?.floor || 1}
          postal={addressData?.mapId}
          type={addressData?.type}
          name={addressData?.name || ""}
        />
        <Form onSubmit={handleSubmitClick}>
          <Modal.Body>
            <HHStatusField
              handleGroupChange={(toggleValue) => {
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
              <div className="text-center">
                <DncDateField
                  changeDate={hhDnctime}
                  handleDateChange={(date) => {
                    const dateValue = date as Date;
                    setHhDnctime(dateValue.getTime());
                  }}
                />
              </div>
            </Collapse>
            <Collapse in={isNotHome}>
              <div className="text-center">
                <HHNotHomeField
                  changeValue={hhNhcount}
                  handleGroupChange={(toggleValue) => {
                    setHhNhcount(toggleValue);
                  }}
                />
              </div>
            </Collapse>
            <HHTypeField
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              handleChange={(option: any) =>
                setHhtype(
                  option.map((opt: SelectProps) => {
                    return {
                      id: opt.value,
                      code: opt.label
                    };
                  })
                )
              }
              changeValue={hhType}
              options={policy.options.map((option) => {
                return {
                  label: option.description,
                  value: option.id
                };
              })}
            />
            <div
              style={{
                position: "relative"
              }}
            >
              <GenericTextAreaField
                label="Notes"
                name="note"
                handleChange={(e: ChangeEvent<HTMLElement>) => {
                  const { value } = e.target as HTMLInputElement;
                  setHhNote(value);
                }}
                changeValue={hhNote}
              />
            </div>
            {addressData?.type === TERRITORY_TYPES.SINGLE_STORY && (
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={policy.userRole}
              >
                <>
                  <GenericInputField
                    inputType="number"
                    label="Territory Sequence"
                    name="sequence"
                    handleChange={(e: ChangeEvent<HTMLElement>) => {
                      const { value } = e.target as HTMLInputElement;
                      const parsedValue = parseInt(value);
                      setUnitSequence(parsedValue);
                    }}
                    changeValue={unitSequence.toString()}
                  />
                </>
              </ComponentAuthorizer>
            )}
            {addressData?.type === TERRITORY_TYPES.SINGLE_STORY && (
              <GenericInputField
                label="Map Coordinates"
                name="location"
                placeholder="Click to open map"
                handleClick={() => {
                  ModalManager.show(ChangeMapGeolocation, {
                    coordinates: coordinates || addressData?.coordinates,
                    isNew: true,
                    origin: origin
                  }).then((result) => {
                    const coordinates = result as {
                      lat: number;
                      lng: number;
                    };
                    if (coordinates) {
                      setLocation(`${coordinates.lat}, ${coordinates.lng}`);
                      setCoordinates(coordinates);
                    }
                  });
                }}
                changeValue={location}
                required={false}
                information="Latitude and Longitude of the address."
              />
            )}
          </Modal.Body>
          <ModalFooter
            handleClick={() => modal.hide()}
            isSaving={isSaving}
            userAccessLevel={policy.userRole}
          >
            {addressData?.type &&
            addressData?.type === TERRITORY_TYPES.SINGLE_STORY ? (
              <>
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                  userPermission={policy.userRole}
                >
                  <Button
                    variant="secondary"
                    onClick={() => {
                      modal.hide();
                      confirmAlert({
                        customUI: ({ onClose }) => {
                          return (
                            <Container>
                              <Card bg="warning" className="text-center">
                                <Card.Header>
                                  Warning ⚠️
                                  <HelpButton
                                    link={
                                      WIKI_CATEGORIES.ADD_DELETE_PRIVATE_PROPERTY
                                    }
                                    isWarningButton={true}
                                  />
                                </Card.Header>
                                <Card.Body>
                                  <Card.Title>Are You Very Sure ?</Card.Title>
                                  <Card.Text>
                                    This action will delete private property
                                    number {unitDetails?.number} of{" "}
                                    {addressData?.name}.
                                  </Card.Text>
                                  <Button
                                    className="m-1"
                                    variant="primary"
                                    onClick={() => {
                                      handleDeleteProperty();
                                      onClose();
                                    }}
                                  >
                                    Yes, Delete It.
                                  </Button>
                                  <Button
                                    className="no-confirm-btn"
                                    variant="primary"
                                    onClick={() => {
                                      onClose();
                                    }}
                                  >
                                    No
                                  </Button>
                                </Card.Body>
                              </Card>
                            </Container>
                          );
                        }
                      });
                    }}
                  >
                    Delete
                  </Button>
                </ComponentAuthorizer>
              </>
            ) : (
              <></>
            )}
            {hhNote && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => setHhNote("")}
              >
                Clear Note
              </Button>
            )}
          </ModalFooter>
        </Form>
      </Modal>
    );
  }
);

export default UpdateUnitStatus;
