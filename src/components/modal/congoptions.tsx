import NiceModal from "@ebay/nice-modal-react";
import "../../css/sortable.css";
import { Info, GripVertical, Trash2, Plus, ListPlus } from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { PB_FIELDS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import {
  HHOptionProps,
  UpdateCongregationOptionsModalProps
} from "../../utils/interface";
import ModalSubmitButton from "../form/submit";
import { callFunction, getList, ignoreAbort } from "../../utils/pocketbase";
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
  restrictToVerticalAxis,
  restrictToParentElement
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RecordModel } from "pocketbase";

const toHHOption = (option: RecordModel): HHOptionProps => ({
  id: option.id,
  code: option.code,
  description: option.description,
  isCountable: option.is_countable,
  isDefault: option.is_default,
  sequence: option.sequence
});

const FieldTooltip = ({
  title,
  disabled
}: {
  title: string;
  disabled?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip disabled={disabled}>
      <TooltipTrigger render={<span className="inline-flex items-center" />}>
        <Info className="size-3 text-primary/70 hover:text-primary cursor-help transition-colors" />
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface SortableOptionRowProps {
  id: string;
  option: HHOptionProps;
  index: number;
  sequence: number;
  isAnyDragging?: boolean;
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
  isAnyDragging = false,
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
    opacity: isDragging ? 0.4 : 1,
    pointerEvents: (isAnyDragging && !isDragging ? "none" : undefined) as
      | "none"
      | undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b rounded-t-lg">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip disabled={isAnyDragging}>
              <TooltipTrigger
                render={
                  <span
                    className="touch-none select-none cursor-grab active:cursor-grabbing p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    {...attributes}
                    {...listeners}
                    role="button"
                    tabIndex={0}
                    aria-label={t(
                      "congregation.dragToReorder",
                      "Drag to reorder"
                    )}
                  />
                }
              >
                <GripVertical className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">
                {t("congregation.dragToReorder", "Drag to reorder")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge
            variant="secondary"
            className="size-6 rounded-full p-0 flex items-center justify-center text-xs font-medium"
          >
            {sequence}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(index)}
          aria-label={t("common.delete", "Delete")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Code + Description */}
        <div className="flex gap-3">
          <div className="w-24 shrink-0 space-y-1">
            <Label
              htmlFor={`code-${index}`}
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              {t("common.code", "Code")}
              <FieldTooltip
                title={t(
                  "congregation.optionCodeTooltip",
                  "Appears in territory house boxes"
                )}
                disabled={isAnyDragging}
              />
            </Label>
            <Input
              id={`code-${index}`}
              required
              placeholder="xx"
              value={option.code}
              onChange={(e) => onCodeChange(index, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <Label
              htmlFor={`desc-${index}`}
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              {t("common.description", "Description")}
              <FieldTooltip
                title={t(
                  "congregation.optionDescTooltip",
                  "Appears in dropdown list"
                )}
                disabled={isAnyDragging}
              />
            </Label>
            <Input
              id={`desc-${index}`}
              required
              value={option.description}
              onChange={(e) => onDescriptionChange(index, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Countable + Default settings */}
        <div className="rounded-md border divide-y overflow-hidden">
          <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <Checkbox
              checked={option.isCountable}
              onCheckedChange={(checked) => onCountableChange(index, !!checked)}
            />
            <span className="flex items-center gap-1.5 text-sm flex-1">
              {t("congregation.countable", "Countable")}
              <FieldTooltip
                title={t(
                  "congregation.optionCountableTooltip",
                  "Counts in completion %"
                )}
                disabled={isAnyDragging}
              />
            </span>
          </label>
          <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <Switch
              size="sm"
              checked={option.isDefault}
              onCheckedChange={(checked) => onDefaultChange(index, checked)}
            />
            <span className="flex items-center gap-1.5 text-sm flex-1">
              {t("congregation.default", "Default")}
              <FieldTooltip
                title={t(
                  "congregation.optionDefaultTooltip",
                  "Default household type"
                )}
                disabled={isAnyDragging}
              />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

const UpdateCongregationOptions = NiceModal.create(
  ({ currentCongregation }: UpdateCongregationOptionsModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      size: "lg"
    });
    const { confirm } = useConfirm();

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
      (document.activeElement as HTMLElement)?.blur();
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

    const handleSubmitCongOptions = async () => {
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

      const confirmUpdate = await confirm({
        title: t("congregation.confirmUpdate", "Confirm Update"),
        message: t(
          "congregation.deleteOptionsWarning",
          "Options [{{options}}] will be removed from the dropdown.\nExisting records will use the default option instead.\nYou cannot undo this.",
          { options: deletedOptions.join(", ") }
        ),
        confirmText: t("common.update", "Update"),
        variant: "warning"
      });

      if (confirmUpdate) {
        await updateOptions();
      }
    };

    const updateOptions = async () => {
      await runAction(
        async () => {
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
          const refreshed = await getList("options", {
            filter: `congregation="${currentCongregation}"`,
            requestKey: `refresh-options-${currentCongregation}`,
            sort: "sequence",
            fields: PB_FIELDS.CONGREGATION_OPTIONS
          });
          modal.resolve(refreshed.map(toHHOption));
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    useEffect(() => {
      const getHHOptions = async () => {
        const data = await getList("options", {
          filter: `congregation="${currentCongregation}"`,
          requestKey: `get-options-${currentCongregation}`,
          sort: "sequence",
          fields: PB_FIELDS.CONGREGATION_OPTIONS
        });

        setOptions(data.map(toHHOption));
      };
      ignoreAbort(getHHOptions)();
    }, [currentCongregation]);

    useEffect(() => {
      if (options.length > 0 && options[options.length - 1]?.isNew) {
        listEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end"
        });
      }
    }, [options]);

    const addNewOption = () => {
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
    };

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
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t("congregation.householdOptions", "Household Options")}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmitCongOptions();
            }}
            className="space-y-4"
          >
            <div className="sortable-modal-body max-h-[70dvh] space-y-3 overflow-y-auto">
              <div className="space-y-3">
                {visibleOptions.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                    <Info className="size-3 shrink-0" />
                    {visibleOptions.length >= 2
                      ? t(
                          "congregation.dragEditHint",
                          "Drag rows to reorder. Click fields to edit."
                        )
                      : t("common.clickToEdit", "Click fields to edit.")}
                  </p>
                )}

                {visibleOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <ListPlus className="size-7 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {t(
                          "congregation.noOptionsYet",
                          "No household options yet"
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-65">
                        {t(
                          "congregation.noOptionsHint",
                          "Add options for publishers to identify and categorize addresses (e.g. English, Chinese)."
                        )}
                      </p>
                    </div>
                    <Button type="button" onClick={addNewOption}>
                      <Plus className="size-4" />
                      {t("congregation.addFirstOption", "Add First Option")}
                    </Button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[
                      restrictToVerticalAxis,
                      restrictToParentElement
                    ]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={visibleOptions.map(
                        (opt) => opt.id || `new-${opt.code}`
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-3 p-2">
                        {options.map(
                          (option, index) =>
                            !option.isDeleted && (
                              <SortableOptionRow
                                key={option.id || `new-${option.code}`}
                                id={option.id || `new-${option.code}`}
                                option={option}
                                index={index}
                                isAnyDragging={!!activeId}
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
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeId && activeOption ? (
                        <div className="rounded-lg border bg-card shadow-lg rotate-2 scale-105 border-primary">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b rounded-t-lg">
                            <GripVertical className="size-4 text-muted-foreground" />
                            <Badge className="size-6 rounded-full p-0 flex items-center justify-center text-xs">
                              {activeIndex + 1}
                            </Badge>
                          </div>
                          <div className="p-3 text-sm font-medium">
                            {activeOption.description || activeOption.code}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" type="button" onClick={addNewOption}>
                <Plus className="size-4" />
                {t("congregation.newOption", "New Option")}
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => modal.hide()}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <ModalSubmitButton isSaving={isSaving} />
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default UpdateCongregationOptions;
