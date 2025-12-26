import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, useEffect, ChangeEvent, useRef } from "react";
import {
  Form,
  Modal,
  Badge,
  OverlayTrigger,
  Tooltip,
  Card,
  Container,
  Image,
  Row,
  Col,
  Stack
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { PB_FIELDS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import {
  HHOptionProps,
  OptionTooltipProps,
  UpdateCongregationOptionsModalProps
} from "../../utils/interface";
import GenericInputField from "../form/input";
import ModalSubmitButton from "../form/submit";
import { callFunction, getList } from "../../utils/pocketbase";
import GenericButton from "../navigation/button";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import "../../css/sortable.css";
import "../../css/congoptions.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const OptionTooltip = ({ id, children, title }: OptionTooltipProps) => (
  <OverlayTrigger
    overlay={<Tooltip id={id}>{title}</Tooltip>}
    placement="bottom"
  >
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {children}
    </span>
  </OverlayTrigger>
);

interface SortableOptionRowProps {
  id: string;
  option: HHOptionProps;
  index: number;
  sequence: number;
  onCodeChange: (index: number, value: string) => void;
  onDescriptionChange: (index: number, value: string) => void;
  onCountableChange: (index: number, checked: boolean) => void;
  onDefaultChange: (index: number, checked: boolean) => void;
  onDelete: (index: number) => void;
}

const SortableOptionRow = ({
  id,
  option,
  index,
  sequence,
  onCodeChange,
  onDescriptionChange,
  onCountableChange,
  onDefaultChange,
  onDelete
}: SortableOptionRowProps) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const handleCodeChange = (event: ChangeEvent<HTMLElement>) => {
    const { value } = event.target as HTMLInputElement;
    onCodeChange(index, value);
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLElement>) => {
    const { value } = event.target as HTMLInputElement;
    onDescriptionChange(index, value);
  };

  return (
    <Card ref={setNodeRef} style={style} className="option-card">
      <Card.Header className="option-header">
        <Stack direction="horizontal" gap={2}>
          <OverlayTrigger
            overlay={
              <Tooltip>
                {t("congregation.dragToReorder", "Drag to reorder")}
              </Tooltip>
            }
            placement="top"
          >
            <span
              className="drag-handle"
              {...attributes}
              {...listeners}
              role="button"
              tabIndex={0}
              aria-label={t("congregation.dragToReorder", "Drag to reorder")}
            >
              ⋮⋮
            </span>
          </OverlayTrigger>
          <Badge bg="secondary" pill>
            {sequence}
          </Badge>
        </Stack>
        <GenericButton
          size="sm"
          variant="outline-danger"
          label="🗑️"
          onClick={() => onDelete(index)}
          aria-label={t("common.delete", "Delete")}
        />
      </Card.Header>

      <Card.Body className="option-body">
        <Row className="g-3">
          <Col xs={12} sm={4}>
            <Form.Group>
              <Form.Label className="small text-uppercase fw-semibold text-muted">
                <OptionTooltip
                  id={`code-${index}`}
                  title={t(
                    "congregation.optionCodeTooltip",
                    "Appears in territory house boxes"
                  )}
                >
                  <span className="info-icon">ⓘ</span>
                </OptionTooltip>
                {t("common.code", "Code")}
              </Form.Label>
              <GenericInputField
                name={`code-${index}`}
                required
                placeholder="xx"
                changeValue={option.code}
                handleChange={handleCodeChange}
              />
            </Form.Group>
          </Col>

          <Col xs={12} sm={8}>
            <Form.Group>
              <Form.Label className="small text-uppercase fw-semibold text-muted">
                <OptionTooltip
                  id={`description-${index}`}
                  title={t(
                    "congregation.optionDescTooltip",
                    "Appears in dropdown list"
                  )}
                >
                  <span className="info-icon">ⓘ</span>
                </OptionTooltip>
                {t("common.description", "Description")}
              </Form.Label>
              <GenericInputField
                name={`description-${index}`}
                required
                changeValue={option.description}
                handleChange={handleDescriptionChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mt-1">
          <Col xs={6} sm={4}>
            <Form.Group>
              <Form.Label className="small text-uppercase fw-semibold text-muted">
                <OptionTooltip
                  id={`countable-${index}`}
                  title={t(
                    "congregation.optionCountableTooltip",
                    "Counts in completion %"
                  )}
                >
                  <span className="info-icon">ⓘ</span>
                </OptionTooltip>
                {t("congregation.countable", "Countable")}
              </Form.Label>
              <Form.Check
                type="checkbox"
                id={`countable-${index}`}
                checked={option.isCountable}
                onChange={(e) => onCountableChange(index, e.target.checked)}
                className="mt-2"
              />
            </Form.Group>
          </Col>

          <Col xs={6} sm={4}>
            <Form.Group>
              <Form.Label className="small text-uppercase fw-semibold text-muted">
                <OptionTooltip
                  id={`default-${index}`}
                  title={t(
                    "congregation.optionDefaultTooltip",
                    "Default household type"
                  )}
                >
                  <span className="info-icon">ⓘ</span>
                </OptionTooltip>
                {t("congregation.default", "Default")}
              </Form.Label>
              <Form.Check
                type="radio"
                id={`default-${index}`}
                name="defaultOption"
                checked={option.isDefault}
                onChange={(e) => onDefaultChange(index, e.target.checked)}
                className="mt-2"
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

const UpdateCongregationOptions = NiceModal.create(
  ({ currentCongregation }: UpdateCongregationOptionsModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const modal = useModal();

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [deletedOptions, setDeletedOptions] = useState<Array<string>>([]);
    const [options, setOptions] = useState<Array<HHOptionProps>>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const listEndRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );

    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        setOptions((items) => {
          const activeIndex = items.findIndex(
            (item) => (item.id || `new-${item.code}`) === active.id
          );
          const overIndex = items.findIndex(
            (item) => (item.id || `new-${item.code}`) === over.id
          );
          return arrayMove(items, activeIndex, overIndex);
        });
      }
    };

    const handleSubmitCongOptions = async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const activeOptions = options.filter((option) => !option.isDeleted);
      const codes = activeOptions.map((option) => option.code);

      if (codes.length !== new Set(codes).size) {
        notifyWarning(
          t(
            "congregation.duplicateOptionCodes",
            "Duplicate option codes found. Please check your input."
          )
        );
        return;
      }

      if (activeOptions.filter((option) => option.isDefault).length !== 1) {
        notifyWarning(
          t(
            "congregation.selectOneDefault",
            "Please select one default option."
          )
        );
        return;
      }

      if (deletedOptions.length === 0) {
        await updateOptions();
        return;
      }

      const confirmUpdate = window.confirm(
        t(
          "congregation.deleteOptionsWarning",
          `⚠️ WARNING: You have removed [{{options}}] from the household dropdown list. Existing records with these options will be replaced with the default option. Proceed?`,
          { options: deletedOptions.join(", ") }
        )
      );

      if (confirmUpdate) {
        await updateOptions();
      }
    };

    const updateOptions = async () => {
      try {
        setIsSaving(true);
        const optionsList = options
          .filter((option) => !(option.isNew && option.isDeleted))
          .map((option, index) => ({
            id: option.isNew ? "" : option.id,
            code: option.code,
            description: option.description,
            is_countable: option.isCountable,
            is_default: option.isDefault,
            sequence: index + 1,
            is_deleted: option.isDeleted
          }));
        await callFunction("options/update", {
          method: "POST",
          body: { congregation: currentCongregation, options: optionsList }
        });
        notifyWarning(
          t(
            "congregation.optionsUpdated",
            "Congregation household options updated."
          )
        );
        window.location.reload();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };

    useEffect(() => {
      const getHHOptions = async () => {
        const data = await getList("options", {
          filter: `congregation="${currentCongregation}"`,
          requestKey: `get-options-${currentCongregation}`,
          sort: "sequence",
          fields: PB_FIELDS.CONGREGATION_OPTIONS
        });

        const householdTypes = data.map((option) => ({
          id: option.id,
          code: option.code,
          description: option.description,
          isCountable: option.is_countable,
          isDefault: option.is_default,
          sequence: option.sequence
        }));
        setOptions(householdTypes);
      };
      getHHOptions();
    }, [currentCongregation]);

    useEffect(() => {
      if (options.length > 0 && options[options.length - 1]?.isNew) {
        listEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end"
        });
      }
    }, [options]);

    const visibleOptions = options.filter((opt) => !opt.isDeleted);
    const visibleIndexMap = new Map(
      visibleOptions.map((opt, idx) => [opt.id || `new-${opt.code}`, idx])
    );

    const activeOption = activeId
      ? options.find((opt) => (opt.id || `new-${opt.code}`) === activeId)
      : null;
    const activeIndex = activeOption
      ? (visibleIndexMap.get(activeOption.id || `new-${activeOption.code}`) ??
        -1)
      : -1;

    return (
      <Modal
        {...bootstrapDialog(modal)}
        dialogClassName="modal-xl"
        onHide={() => modal.remove()}
      >
        <Form onSubmit={handleSubmitCongOptions}>
          <Modal.Header>
            <Modal.Title>
              {t("congregation.householdOptions", "Household Options")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="sortable-modal-body">
            <Container fluid>
              <Stack
                direction="horizontal"
                gap={2}
                className="sortable-instructions"
              >
                <Image
                  src={getAssetUrl("information.svg")}
                  alt="Information"
                  width={18}
                  height={18}
                />
                <span>
                  {t(
                    "congregation.dragEditHint",
                    "Drag rows or use arrow buttons to reorder. Click fields to edit."
                  )}
                </span>
              </Stack>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleOptions.map(
                    (opt) => opt.id || `new-${opt.code}`
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack gap={3} className="sortable-cards-list">
                    {options.map(
                      (option, index) =>
                        !option.isDeleted && (
                          <SortableOptionRow
                            key={option.id || `new-${option.code}`}
                            id={option.id || `new-${option.code}`}
                            option={option}
                            index={index}
                            sequence={
                              (visibleIndexMap.get(
                                option.id || `new-${option.code}`
                              ) ?? 0) + 1
                            }
                            onCodeChange={(idx, value) => {
                              const newOptions = [...options];
                              newOptions[idx].code = value
                                .toLowerCase()
                                .replace(/[^a-z]/g, "")
                                .substring(0, 2);
                              setOptions(newOptions);
                            }}
                            onDescriptionChange={(idx, value) => {
                              const newOptions = [...options];
                              newOptions[idx].description = value;
                              setOptions(newOptions);
                            }}
                            onCountableChange={(idx, checked) => {
                              const newOptions = [...options];
                              newOptions[idx].isCountable = checked;
                              setOptions(newOptions);
                            }}
                            onDefaultChange={(idx, checked) => {
                              const newOptions = options.map((opt, i) => ({
                                ...opt,
                                isDefault: i === idx && checked
                              }));
                              setOptions(newOptions);
                            }}
                            onDelete={(idx) => {
                              if (visibleOptions.length === 1) {
                                notifyWarning(
                                  t(
                                    "congregation.minimumOneOption",
                                    "There must be at least one option in the dropdown list."
                                  )
                                );
                                return;
                              }
                              const newOptions = [...options];
                              if (option.isNew) {
                                newOptions.splice(idx, 1);
                              } else {
                                setDeletedOptions([
                                  ...deletedOptions,
                                  option.code
                                ]);
                                newOptions[idx].isDeleted = true;
                              }
                              setOptions(newOptions);
                            }}
                          />
                        )
                    )}
                    <div ref={listEndRef} />
                  </Stack>
                </SortableContext>
                <DragOverlay>
                  {activeId && activeOption ? (
                    <Card className="option-card option-card-dragging">
                      <Card.Header className="option-header">
                        <Stack direction="horizontal" gap={2}>
                          <span className="drag-handle">⋮⋮</span>
                          <Badge bg="primary" pill>
                            {activeIndex + 1}
                          </Badge>
                        </Stack>
                      </Card.Header>
                      <Card.Body>
                        <strong>{activeOption.description}</strong>
                      </Card.Body>
                    </Card>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </Container>
          </Modal.Body>
          <Modal.Footer className="justify-content-around">
            <GenericButton
              variant="secondary"
              onClick={() => modal.hide()}
              label={t("common.close", "Close")}
            />
            <GenericButton
              variant="outline-primary"
              onClick={() => {
                const nextSequence =
                  options.length > 0
                    ? Math.max(...options.map((opt) => opt.sequence)) + 1
                    : 1;
                setOptions([
                  ...options,
                  {
                    id: `new-${Date.now()}`,
                    code: "",
                    description: "",
                    isCountable: true,
                    isDefault: false,
                    sequence: nextSequence,
                    isNew: true,
                    isDeleted: false
                  }
                ]);
              }}
              label={`+ ${t("congregation.newOption", "New Option")}`}
            />
            <ModalSubmitButton isSaving={isSaving} />
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default UpdateCongregationOptions;
