import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal, ListGroup } from "react-bootstrap";
import {
  LINK_SELECTOR_VIEWPORT_HEIGHT,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import LinkTypeDescription from "../../utils/helpers/linkdesc";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import { LinkSession } from "../../utils/policies";
import ModalFooter from "../form/footer";
import { useEffect, useState } from "react";
import { AssignmentModalProps } from "../../utils/interface";
import { deleteDataById } from "../../utils/pocketbase";
import { useTranslation } from "react-i18next";
import GenericButton from "../navigation/button";

const GetAssignments = NiceModal.create(
  ({
    assignments,
    assignmentType,
    assignmentTerritory
  }: AssignmentModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();

    const [currentAssignments, setCurrentAssignments] =
      useState<LinkSession[]>(assignments);

    const deleteAssignment = async (linkid: string) => {
      await deleteDataById("assignments", linkid, {
        requestKey: `assignment-delete-${linkid}`
      });
    };

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
              ? t(
                  "assignment.linkWithTerritory",
                  "{{territory}} {{type}} Links",
                  {
                    territory: assignmentTerritory,
                    type: LinkTypeDescription(assignmentType)
                  }
                )
              : t("assignment.assignments", "Assignments")}
          </Modal.Title>
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
                          ? t("assignment.link", "Link")
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
                        {t("assignments.publisher", "Publisher")}:{" "}
                        {assignment.publisherName}
                      </div>
                    )}
                    <div className="fluid-text">
                      {t("assignments.createdDate", "Created Dt")}:{" "}
                      {LinkDateFormatter.format(
                        new Date(assignment.tokenCreatetime)
                      )}
                    </div>
                    <div className="fluid-text">
                      {t("assignments.expiryDate", "Expiry Dt")}:{" "}
                      {LinkDateFormatter.format(
                        new Date(assignment.tokenEndtime)
                      )}
                    </div>
                  </div>
                  <GenericButton
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
                    dataAttributes={{
                      linkid: assignment.id,
                      postal: assignment.mapId
                    }}
                    label="🗑️"
                  />
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
