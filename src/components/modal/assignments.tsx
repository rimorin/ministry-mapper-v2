import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import { LinkSession } from "../../utils/policies";
import ModalFooter from "../form/footer";
import { firestore } from "../../firebase";
import { useEffect, useState } from "react";
import { AssignmentModalProps } from "../../utils/interface";
import { deleteDoc, doc } from "firebase/firestore";
import DeleteIcon from "@mui/icons-material/Delete";
import buildLink from "../../utils/helpers/buildlink";
import LaunchIcon from "@mui/icons-material/Launch";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";
import React from "react";
// import {
//   Box,
//   DialogContent,
//   DialogTitle,
//   IconButton,
//   List,
//   ListDivider,
//   ListItem,
//   ListItemContent,
//   ListItemDecorator,
//   Modal,
//   ModalDialog,
//   Typography
// } from "@mui/joy";

const GetAssignments = NiceModal.create(
  ({
    assignments,
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

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog> */}
        <DialogTitle>{`${assignmentTerritory} Assignments`}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              maxHeight: 350,
              overflow: "auto",
              borderRadius: "sm"
            }}
          >
            <List>
              {currentAssignments.map((assignment) => {
                const linkId = assignment.key;
                return (
                  <>
                    <ListItem
                      key={`assignment-${assignment.key}`}
                      secondaryAction={
                        <IconButton
                          onClick={() => {
                            deleteDoc(
                              doc(
                                firestore,
                                `congregations/${congregation}/links`,
                                linkId
                              )
                            );
                            setCurrentAssignments((currentAssignments) =>
                              currentAssignments.filter(
                                (assignment) => assignment.key !== linkId
                              )
                            );
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        role={undefined}
                        onClick={() => {
                          window.open(
                            buildLink(assignment.key),
                            "_blank",
                            "noopener"
                          );
                        }}
                        dense
                      >
                        <LaunchIcon />
                      </ListItemButton>
                      {/* <ListItemDecorator>
                        <IconButton
                          onClick={() => {
                            window.open(
                              buildLink(assignment.key),
                              "_blank",
                              "noopener"
                            );
                          }}
                        ></IconButton>
                      </ListItemDecorator> */}
                      <ListItemText
                        primary={assignment.publisher_name}
                        secondary={
                          <React.Fragment>
                            {/* {assignment.publisher_name && (
                              <Typography variant="body2">
                                Publisher : {assignment.publisher_name}
                              </Typography>
                            )} */}
                            <Typography variant="body2">
                              Created Dt :{" "}
                              {LinkDateFormatter.format(
                                new Date(assignment.create_date)
                              )}
                            </Typography>
                            <Typography variant="body2">
                              Expiry Dt :{" "}
                              {LinkDateFormatter.format(
                                new Date(assignment.end_date)
                              )}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </>
                );
              })}
            </List>
          </Box>
        </DialogContent>
        <ModalFooter
          handleClick={() => modal.hide()}
          userAccessLevel={USER_ACCESS_LEVELS.READ_ONLY.CODE}
        />
        {/* </ModalDialog> */}
        {/* <Modal.Header>
          <Modal.Title>
            {isAssignOrPersonalAssignments
              ? `${assignmentTerritory} ${LinkTypeDescription(
                  assignmentType
                )} Links`
              : "Assignments"}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.GET_ASSIGNMENTS} />
        </Modal.Header> */}
        {/* <Modal.Body>
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
        </Modal.Body> */}
      </Dialog>
    );
  }
);

export default GetAssignments;
