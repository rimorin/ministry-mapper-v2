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
import { firestore } from "../../firebase";
import { useEffect, useState } from "react";
import { AssignmentModalProps } from "../../utils/interface";
import { deleteDoc, doc } from "firebase/firestore";
import buildLink from "../../utils/helpers/buildlink";

const GetAssignments = NiceModal.create(
  ({
    assignments,
    assignmentType,
    assignmentTerritory,
    congregation
  }: AssignmentModalProps) => {
    const modal = useModal();

    const [currentAssignments, setCurrentAssignments] =
      useState<LinkSession[]>(assignments);

    useEffect(() => {
      if (currentAssignments.length === 0) {
        modal.hide();
      }
    }, [currentAssignments]);

    const isAssignOrPersonalAssignments = assignmentType && assignmentTerritory;

    return (
      <Modal {...bootstrapDialog(modal)}>
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
                  key={`assignment-${assignment.key}`}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="ms-2 me-auto">
                    <div className="fluid-text fw-bold">
                      <a
                        href={buildLink(assignment.key)}
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
                        {LinkTypeDescription(assignment.type)}
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
                        new Date(assignment.createDate)
                      )}
                    </div>
                    <div className="fluid-text">
                      Expiry Dt :{" "}
                      {LinkDateFormatter.format(new Date(assignment.endDate))}
                    </div>
                  </div>
                  <Button
                    variant="outline-warning"
                    className="me-1"
                    onClick={async (event) => {
                      const { linkid } = event.currentTarget.dataset;
                      deleteDoc(
                        doc(
                          firestore,
                          `congregations/${congregation}/links`,
                          linkid as string
                        )
                      );
                      setCurrentAssignments((currentAssignments) =>
                        currentAssignments.filter(
                          (assignment) => assignment.key !== linkid
                        )
                      );
                    }}
                    data-linkid={assignment.key}
                    data-postal={assignment.map}
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
