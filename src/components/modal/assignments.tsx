import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal, ListGroup, Button } from "react-bootstrap";
import {
  WIKI_CATEGORIES,
  LINK_SELECTOR_VIEWPORT_HEIGHT,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import LinkTypeDescription from "../../utils/helpers/linkdesc";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import { LinkSession } from "../../utils/policies";
import ModalFooter from "../form/footer";
import HelpButton from "../navigation/help";
import { pb } from "../../utils/pocketbase";
import { useCallback, useEffect, useState } from "react";
import { AssignmentModalProps } from "../../utils/interface";

const GetAssignments = NiceModal.create(
  ({
    assignments,
    assignmentType,
    assignmentTerritory
  }: AssignmentModalProps) => {
    const modal = useModal();

    const [currentAssignments, setCurrentAssignments] =
      useState<LinkSession[]>(assignments);

    const deleteAssignment = useCallback(async (linkid: string) => {
      await pb.collection("assignments").delete(linkid, {
        requestKey: `assignment-delete-${linkid}`
      });
    }, []);

    useEffect(() => {
      if (currentAssignments.length === 0) {
        modal.hide();
      }
    }, [currentAssignments]);

    const isAssignOrPersonalAssignments = assignmentType && assignmentTerritory;

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {isAssignOrPersonalAssignments
              ? `${assignmentTerritory} ${LinkTypeDescription(
                  assignmentType
                )} Links`
              : "Assignments"}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.GET_ASSIGNMENTS} />
        </Modal.Header>
        <Modal.Body>
          <ListGroup
            style={{
              height: LINK_SELECTOR_VIEWPORT_HEIGHT,
              overflow: "auto"
            }}
          >
            {currentAssignments.map((assignment) => {
              return (
                <ListGroup.Item
                  key={`assignment-${assignment.id}`}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="ms-2 me-auto">
                    <div className="fluid-text fw-bold">
                      <a
                        href={`map/${assignment.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {isAssignOrPersonalAssignments
                          ? "Link"
                          : assignment.name}
                      </a>
                    </div>
                    {!isAssignOrPersonalAssignments && (
                      <div className="fluid-text">
                        {LinkTypeDescription(assignment.linkType)}
                      </div>
                    )}
                    {assignment.publisherName && (
                      <div className="fluid-text">
                        Publisher : {assignment.publisherName}
                      </div>
                    )}
                    <div className="fluid-text">
                      Created Dt :{" "}
                      {LinkDateFormatter.format(
                        new Date(assignment.tokenCreatetime)
                      )}
                    </div>
                    <div className="fluid-text">
                      Expiry Dt :{" "}
                      {LinkDateFormatter.format(
                        new Date(assignment.tokenEndtime)
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline-warning"
                    className="me-1"
                    onClick={async (event) => {
                      const { linkid } = event.currentTarget.dataset;
                      await deleteAssignment(linkid as string);
                      setCurrentAssignments((currentAssignments) =>
                        currentAssignments.filter(
                          (assignment) => assignment.id !== linkid
                        )
                      );
                    }}
                    data-linkid={assignment.id}
                    data-postal={assignment.mapId}
                  >
                    🗑️
                  </Button>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Modal.Body>
        <ModalFooter
          handleClick={() => modal.hide()}
          userAccessLevel={USER_ACCESS_LEVELS.READ_ONLY.CODE}
        />
      </Modal>
    );
  }
);

export default GetAssignments;
