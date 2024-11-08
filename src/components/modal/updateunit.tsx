import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form, Button, Container, Card } from "react-bootstrap";
import { confirmAlert } from "react-confirm-alert";
import { WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { UpdateUnitModalProps } from "../../utils/interface";
import GenericInputField from "../form/input";
import ModalSubmitButton from "../form/submit";
import HelpButton from "../navigation/help";
import { usePostHog } from "posthog-js/react";
import { pb } from "../../pocketbase";

const UpdateUnit = NiceModal.create(
  ({
    mapId,
    unitNo,
    unitSequence,
    unitLength,
    unitDisplay
  }: UpdateUnitModalProps) => {
    const [unitSeq, setUnitSeq] = useState<number | undefined>(unitSequence);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();
    const posthog = usePostHog();

    const processPostalUnitSequence = async (
      mapId: string,
      unitNumber: string,
      sequence: number | undefined
    ) => {
      setIsSaving(true);
      try {
        pb.send("map/code/update", {
          method: "POST",
          body: {
            map: mapId,
            code: unitNumber,
            sequence
          }
        });
        posthog?.capture("update_unit_sequence", {
          mapId,
          unitNumber,
          sequence
        });
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    const handleUnitDelete = async (mapId: string, unitNumber: string) => {
      setIsSaving(true);
      try {
        await pb.send("map/code/delete", {
          method: "POST",
          body: {
            map: mapId,
            code: unitNumber
          }
        });
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    const handleUpdateUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      processPostalUnitSequence(mapId, unitNo, unitSeq);
    };

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Unit {unitDisplay}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.UPDATE_UNIT_NUMBER} />
        </Modal.Header>
        <Form onSubmit={handleUpdateUnit}>
          <Modal.Body>
            <GenericInputField
              inputType="number"
              label="Sequence Number"
              name="sequence"
              placeholder="Optional unit row sequence number"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                const parsedValue = parseInt(value);
                setUnitSeq(isNaN(parsedValue) ? undefined : parsedValue);
              }}
              changeValue={
                unitSeq === undefined ? undefined : unitSeq.toString()
              }
            />
          </Modal.Body>
          <Modal.Footer className="justify-content-around">
            <Button variant="secondary" onClick={() => modal.hide()}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const hasOnlyOneUnitNumber = unitLength === 1;
                if (hasOnlyOneUnitNumber) {
                  alert(`Territory requires at least 1 unit number.`);
                  return;
                }
                modal.hide();
                confirmAlert({
                  customUI: ({ onClose }) => {
                    return (
                      <Container>
                        <Card bg="warning" className="text-center">
                          <Card.Header>
                            Warning ⚠️
                            <HelpButton
                              link={WIKI_CATEGORIES.ADD_DELETE_PRIVATE_PROPERTY}
                              isWarningButton={true}
                            />
                          </Card.Header>
                          <Card.Body>
                            <Card.Title>Are You Very Sure ?</Card.Title>
                            <Card.Text>
                              This action will delete unit number {unitNo} of{" "}
                              {mapId}.
                            </Card.Text>
                            <Button
                              className="m-1"
                              variant="primary"
                              onClick={() => {
                                handleUnitDelete(mapId, unitNo);
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
              Delete Unit
            </Button>
            <ModalSubmitButton isSaving={isSaving} />
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default UpdateUnit;
