import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import {
  useState,
  FormEvent,
  useEffect,
  ChangeEvent,
  useCallback
} from "react";
import {
  Form,
  Modal,
  Table,
  Button,
  Badge,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import { PB_FIELDS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import HelpButton from "../navigation/help";
import { pb } from "../../utils/pocketbase";
import {
  HHOptionProps,
  UpdateCongregationOptionsModalProps
} from "../../utils/interface";
import GenericInputField from "../form/input";
import ModalSubmitButton from "../form/submit";

const UpdateCongregationOptions = NiceModal.create(
  ({ currentCongregation }: UpdateCongregationOptionsModalProps) => {
    const modal = useModal();
    const rollbar = useRollbar();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [deletedOptions, setDeletedOptions] = useState<Array<string>>([]);
    const [options, setOptions] = useState<Array<HHOptionProps>>([]);
    const [newOptionAdded, setNewOptionAdded] = useState(false);

    const handleSubmitCongOptions = async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      // check if there are any duplicate codes
      const codes = options
        .filter((option) => !option.isDeleted)
        .map((option) => option.code);
      const uniqueCodes = [...new Set(codes)];
      if (codes.length !== uniqueCodes.length) {
        alert("Duplicate option codes found. Please check your input.");
        return;
      }

      // // check if there are any duplicate sequences
      const sequences = options
        .filter((option) => !option.isDeleted)
        .map((option) => option.sequence);
      const uniqueSequences = [...new Set(sequences)];
      if (sequences.length !== uniqueSequences.length) {
        alert("Duplicate option sequences found. Please check your input.");
        return;
      }

      //  check if there is one selected default option
      const defaultOptions = options.filter(
        (option) => option.isDefault && !option.isDeleted
      );
      if (defaultOptions.length !== 1) {
        alert("Please select one default option.");
        return;
      }

      if (deletedOptions.length === 0) {
        await updateOptions();
        return;
      }
      const confirmUpdate = window.confirm(
        `⚠️ WARNING: You have removed [${deletedOptions.join(", ")}] from the household dropdown list. Existing records with these options will be replaced with the default option. Proceed?`
      );

      if (confirmUpdate) {
        updateOptions();
      }
    };

    const updateOptions = async () => {
      try {
        setIsSaving(true);
        const optionsList = options
          .filter((option) => !(option.isNew && option.isDeleted))
          .map((option) => ({
            id: option.isNew ? "" : option.id,
            code: option.code,
            description: option.description,
            is_countable: option.isCountable,
            is_default: option.isDefault,
            sequence: option.sequence,
            is_deleted: option.isDeleted
          }));
        await pb.send("options/update", {
          method: "POST",
          body: {
            congregation: currentCongregation,
            options: optionsList
          }
        });
        alert("Congregation household options updated.");
        window.location.reload();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    const Link = useCallback(
      ({
        id,
        children,
        title
      }: {
        id: string;
        children: React.ReactNode;
        title: string;
      }) => {
        return (
          <OverlayTrigger
            overlay={<Tooltip id={id}>{title}</Tooltip>}
            placement="bottom"
          >
            <u>{children}</u>
          </OverlayTrigger>
        );
      },
      [currentCongregation]
    );

    useEffect(() => {
      const getHHOptions = async () => {
        const householdTypes = new Array<HHOptionProps>();
        const data = await pb.collection("options").getFullList({
          filter: `congregation="${currentCongregation}"`,
          requestKey: `get-options-${currentCongregation}`,
          sort: "sequence",
          fields: PB_FIELDS.CONGREGATION_OPTIONS
        });

        data.forEach((option) => {
          householdTypes.push({
            id: option.id,
            code: option.code,
            description: option.description,
            isCountable: option.is_countable,
            isDefault: option.is_default,
            sequence: option.sequence
          });
        });
        setOptions(householdTypes);
      };
      getHHOptions();
    }, []);

    // scroll to the bottom of the table when a new option is added
    useEffect(() => {
      if (newOptionAdded) {
        const table = document.getElementById("optionTable");
        if (table) {
          table.scrollIntoView({ behavior: "smooth", block: "end" });
        }
        setNewOptionAdded(false);
      }
    }, [newOptionAdded]);

    return (
      <Modal
        {...bootstrapDialog(modal)}
        dialogClassName="modal-lg"
        onHide={() => modal.remove()}
      >
        <Form onSubmit={handleSubmitCongOptions}>
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
                  options.map(
                    (option, index) =>
                      !option.isDeleted && (
                        <tr key={index}>
                          {option.isNew ? (
                            <td align="center" valign="middle">
                              <GenericInputField
                                name="code"
                                required
                                changeValue={option.code}
                                handleChange={(
                                  event: ChangeEvent<HTMLElement>
                                ) => {
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
                              handleChange={(
                                event: ChangeEvent<HTMLElement>
                              ) => {
                                const { value } =
                                  event.target as HTMLInputElement;
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
                                newOptions[index].isDefault =
                                  event.target.checked;
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
                                if (newOptions.length === 1) {
                                  alert(
                                    "There must be at least one option in the dropdown list."
                                  );
                                  return;
                                }
                                if (!option.isNew) {
                                  setDeletedOptions([
                                    ...deletedOptions,
                                    option.code
                                  ]);
                                  newOptions[index].isDeleted = true;
                                } else {
                                  newOptions.splice(index, 1);
                                }
                                setOptions(newOptions);
                              }}
                            >
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      )
                  )}
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer className="justify-content-around">
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
                  isNew: true,
                  isDeleted: false
                });

                setOptions(newOptions);
                setNewOptionAdded(true);
              }}
            >
              New Option
            </Button>
            <ModalSubmitButton isSaving={isSaving} />
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default UpdateCongregationOptions;
