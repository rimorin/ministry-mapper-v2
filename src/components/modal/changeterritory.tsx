import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useState } from "react";
import { firestore } from "../../firebase";
import { UpdateMapTerritoryModalProps } from "../../utils/interface";
import CloseIcon from "@mui/icons-material/Close";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from "firebase/firestore";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";
// import {
//   CircularProgress,
//   DialogContent,
//   DialogTitle,
//   List,
//   ListItem,
//   ListItemButton,
//   ListItemContent,
//   Modal,
//   ModalClose,
//   ModalDialog,
//   Typography
// } from "@mui/joy";

const UpdateMapTerritory = NiceModal.create(
  ({
    territories,
    mapId,
    congregation,
    territoryId
  }: UpdateMapTerritoryModalProps) => {
    const modal = useModal();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const updateMapTerritory = async (newTerritoryId: string) => {
      const currentAdds = await getDocs(
        query(
          collection(firestore, `congregations/${congregation}/addresses`),
          where("territory", "==", territoryId),
          where("map", "==", mapId)
        )
      );

      const batch = writeBatch(firestore);

      for (const add of currentAdds.docs) {
        const addressId = add.id;
        batch.update(
          doc(
            firestore,
            `congregations/${congregation}/addresses/${addressId}`
          ),
          {
            territory: newTerritoryId
          }
        );
      }

      batch.update(
        doc(firestore, `congregations/${congregation}/maps/${mapId}`),
        {
          territory: newTerritoryId
        }
      );
      setIsSaving(true);
      await batch.commit();
      setIsSaving(false);
      modal.hide();
    };

    // const updateOptions = async () => {
    //   try {
    //     setIsSaving(true);
    //     const batch = writeBatch(firestore);
    //     for (const option of options) {
    //       if (option.isNew) {
    //         batch.set(
    //           doc(
    //             collection(
    //               firestore,
    //               `congregations/${currentCongregation}/options`
    //             )
    //           ),
    //           {
    //             code: option.code,
    //             name: option.description,
    //             is_countable: option.isCountable,
    //             is_default: option.isDefault,
    //             sequence: option.sequence
    //           }
    //         );
    //       } else {
    //         batch.update(
    //           doc(
    //             firestore,
    //             `congregations/${currentCongregation}/options/${option.id}`
    //           ),
    //           {
    //             code: option.code,
    //             description: option.description,
    //             is_countable: option.isCountable,
    //             is_default: option.isDefault,
    //             sequence: option.sequence
    //           }
    //         );
    //       }
    //     }
    //     batch.commit();
    //     alert("Congregation household options updated.");
    //     window.location.reload();
    //   } catch (error) {
    //     errorHandler(error, rollbar);
    //   } finally {
    //     setIsSaving(false);
    //   }
    // };

    // useEffect(() => {
    //   const getOptions = async () => {
    //     try {
    //       const optionsSnapshot = await getDocs(
    //         query(
    //           collection(
    //             firestore,
    //             `congregations/${currentCongregation}/options`
    //           ),
    //           orderBy("sequence")
    //         )
    //       );
    //       const optionValues: Array<HHOptionProps> = [];
    //       for (const element of optionsSnapshot.docs) {
    //         const optionDetails = element.data();
    //         const option = {
    //           id: element.id,
    //           code: optionDetails.code,
    //           description: optionDetails.description,
    //           isCountable: optionDetails.is_countable || false,
    //           isDefault: optionDetails.is_default || false,
    //           sequence: optionDetails.sequence
    //         };
    //         optionValues.push(option);
    //       }
    //       setOptions(optionValues);
    //     } catch (error) {
    //       errorHandler(error, rollbar);
    //     }
    //   };
    //   getOptions();
    // }, [currentCongregation]);

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        <DialogTitle>Change Territory</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => modal.hide()}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <List>
            {territories.map((territory) => {
              if (territory.id === territoryId) {
                return null;
              }

              return (
                <ListItem key={territory.id}>
                  <ListItemButton
                    onClick={async () => await updateMapTerritory(territory.id)}
                  >
                    <ListItemText>
                      <Typography variant="h6">{territory.code}</Typography>
                      <Typography variant="body2">{territory.name}</Typography>
                    </ListItemText>
                    {isSaving && <CircularProgress size="small" />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        {/* <Form onSubmit={handleSubmitCongOptions}>
          <Modal.Header>
            <Modal.Title>Household Options</Modal.Title>
            <HelpButton link={WIKI_CATEGORIES.MANAGE_CONG_OPTIONS} />
          </Modal.Header>
          <Modal.Body
            style={{ height: "50vh", overflow: "auto", paddingBlock: "0px" }}
          >
            <Table
              striped
              bordered
              hover
              className="sticky-table"
              id="optionTable"
            >
              <thead className="sticky-top-cell">
                <tr>
                  <th style={{ width: "15%", textAlign: "center" }}>
                    <Link
                      id="optionCd"
                      title="This code will appear in the territory house boxes. It will be used to indicate the type of household."
                    >
                      Code
                    </Link>
                  </th>
                  <th style={{ width: "35%" }}>
                    <Link
                      id="optionDesc"
                      title="Description will appear in the household dropdown list."
                    >
                      Description
                    </Link>
                  </th>
                  <th style={{ width: "15%" }}>
                    <Link
                      id="optionSeq"
                      title="This determines the positioning of the option in the dropdown list. Dropdown is sorted in ascending order."
                    >
                      Sequence
                    </Link>
                  </th>
                  <th style={{ width: "15%", textAlign: "center" }}>
                    <Link
                      id="optionCountable"
                      title="This determines if the option will be counted in the territory completion percentage."
                    >
                      Countable
                    </Link>
                  </th>
                  <th style={{ width: "15%", textAlign: "center" }}>
                    <Link
                      id="optionDefault"
                      title="This determines the default household type of a congregation territory. Default option will not appear in the territory house boxes."
                    >
                      Default
                    </Link>
                  </th>
                  <th style={{ width: "15%" }}></th>
                </tr>
              </thead>
              <tbody>
                {options &&
                  options.map((option, index) => (
                    <tr key={index}>
                      {option.isNew ? (
                        <td align="center" valign="middle">
                          <GenericInputField
                            name="code"
                            required
                            changeValue={option.code}
                            handleChange={(event: ChangeEvent<HTMLElement>) => {
                              const { value } =
                                event.target as HTMLInputElement;
                              const newOptions = [...options];
                              const optionCode = value
                                .toLowerCase()
                                .replace(/[^a-z]/g, "")
                                .substring(0, 2);
                              newOptions[index].code = optionCode;
                              setOptions(newOptions);
                            }}
                          />
                        </td>
                      ) : (
                        <td align="center" valign="middle">
                          <Badge bg="primary" pill>
                            {option.code}
                          </Badge>
                        </td>
                      )}
                      <td>
                        <GenericInputField
                          name="description"
                          required
                          changeValue={option.description}
                          handleChange={(e: ChangeEvent<HTMLElement>) => {
                            const { value } = e.target as HTMLInputElement;
                            const newOptions = [...options];
                            newOptions[index].description = value;
                            setOptions(newOptions);
                          }}
                        />
                      </td>
                      <td>
                        <GenericInputField
                          name="sequence"
                          inputType="number"
                          required
                          changeValue={option.sequence.toString()}
                          handleChange={(event: ChangeEvent<HTMLElement>) => {
                            const { value } = event.target as HTMLInputElement;
                            const sequence = parseInt(value);
                            if (sequence < 0 || sequence > 99) {
                              return;
                            }
                            const newOptions = [...options];
                            newOptions[index].sequence = sequence;
                            setOptions(newOptions);
                          }}
                        />
                      </td>
                      <td align="center" valign="middle">
                        <Form.Check
                          type="checkbox"
                          checked={option.isCountable}
                          onChange={(event) => {
                            const newOptions = [...options];
                            newOptions[index].isCountable =
                              event.target.checked;
                            setOptions(newOptions);
                          }}
                        />
                      </td>
                      <td align="center" valign="middle">
                        <Form.Check
                          type="radio"
                          checked={option.isDefault}
                          onChange={(event) => {
                            const newOptions = [...options];
                            newOptions.forEach((option) => {
                              option.isDefault = false;
                            });
                            newOptions[index].isDefault = event.target.checked;
                            setOptions(newOptions);
                          }}
                        />
                      </td>
                      <td align="center" valign="middle">
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="me-1"
                          onClick={() => {
                            const newOptions = [...options];
                            // check if there is only one option left
                            if (newOptions.length === 1) {
                              alert(
                                "There must be at least one option in the dropdown list."
                              );
                              return;
                            }
                            newOptions.splice(index, 1);

                            if (option.isDefault) {
                              // if current deleted option is default, set first option as default
                              newOptions[0].isDefault = true;
                            }

                            if (option.code) {
                              // if deleting existing, set code for confirmation alert trigger.
                              setDeletedOptions([
                                ...deletedOptions,
                                option.code
                              ]);
                            }
                            setOptions(newOptions);
                          }}
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Modal.Body> */}
        {/* <Modal.Footer className="justify-content-around">
            <Button variant="secondary" onClick={modal.hide}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const newOptions = [...options];
                // get highest sequence number
                const nextSequence =
                  Math.max(...newOptions.map((option) => option.sequence)) + 1;
                newOptions.push({
                  id: "",
                  code: "",
                  description: "",
                  isCountable: true,
                  isDefault: false,
                  sequence: nextSequence,
                  isNew: true
                });

                // rerender table before scrolling to bottom
                flushSync(() => {
                  setOptions(newOptions);
                });

                // scroll to bottom of table
                const table = document.getElementById("optionTable");
                if (table) {
                  table.scrollIntoView({ behavior: "smooth", block: "end" });
                }
              }}
            >
              New Option
            </Button>
            <ModalSubmitButton isSaving={isSaving} />
          </Modal.Footer> */}
        {/* </Form> */}
        {/* <form onSubmit={handleSubmitCongOptions}>
            <ModalFooter
              handleClick={modal.hide}
              isSaving={isSaving}
              userAccessLevel={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            >
              <Button
                onClick={() => {
                  const newOptions = [...options];
                  // get highest sequence number
                  const nextSequence =
                    Math.max(...newOptions.map((option) => option.sequence)) +
                    1;
                  newOptions.push({
                    id: "",
                    code: "",
                    description: "",
                    isCountable: true,
                    isDefault: false,
                    sequence: nextSequence,
                    isNew: true
                  });

                  // rerender table before scrolling to bottom
                  flushSync(() => {
                    setOptions(newOptions);
                  });

                  // scroll to bottom of table
                  // const table = document.getElementById("optionTable");
                  // if (table) {
                  //   table.scrollIntoView({ behavior: "smooth", block: "end" });
                  // }
                  if (tableRef.current) {
                    tableRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "end"
                    });
                  }
                }}
              >
                New
              </Button>
            </ModalFooter>
          </form> */}
        {/* </ModalDialog> */}
      </Dialog>
    );
  }
);

export default UpdateMapTerritory;
