import NiceModal from "@ebay/nice-modal-react";
import { GripVertical, Info } from "lucide-react";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { MapSequenceUpdateModalProps } from "../../utils/interface";
import { createPortal } from "react-dom";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { cn } from "@/lib/utils";
import { sortableItemEnter } from "@/lib/motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { callFunction, ignoreAbort } from "../../utils/pocketbase";
import "../../css/sortable.css";
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
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import useNotification from "../../hooks/useNotification";
import ComponentAuthorizer from "../navigation/authorizer";

interface SortableItemProps {
  id: string;
  code: string;
  sequence: number;
}

const SortableItem = ({ id, code, sequence }: SortableItemProps) => {
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
    transition
  };

  return (
    <motion.div
      layout
      variants={sortableItemEnter}
      initial="hidden"
      animate="show"
      custom={{ delayIndex: sequence - 1 }}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "sortable-item flex touch-none select-none items-center gap-2 rounded-lg border px-3 py-2 transition-[transform,opacity] duration-200 ease-in",
          isDragging
            ? "cursor-grabbing border-dashed border-primary/50 bg-background/40 opacity-40 shadow-none"
            : "cursor-grab border-[#e0e0e0] bg-background shadow-[0_2px_4px_rgba(0,0,0,0.075)]"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold leading-none text-white">
          {sequence}
        </span>
        <span className="text-[0.95rem] font-semibold text-foreground">
          {code}
        </span>
      </div>
    </motion.div>
  );
};

const DragOverlayItem = ({
  code,
  sequence
}: {
  code: string;
  sequence: number;
}) => (
  <div className="sortable-item sortable-item-dragging flex cursor-grabbing touch-none select-none items-center gap-2 rounded-lg border border-[#e0e0e0] bg-background px-3 py-2 shadow-[0_2px_4px_rgba(0,0,0,0.075)]">
    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold leading-none text-white">
      {sequence}
    </span>
    <span className="flex-1 text-[0.95rem] font-semibold text-foreground">
      {code}
    </span>
  </div>
);

const ChangeMapSequence = NiceModal.create(
  ({
    mapId,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: MapSequenceUpdateModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [codeList, setCodeList] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );

    useEffect(() => {
      let isCleaned = false;
      const fetchAddressList = async () => {
        const response = await callFunction("/map/codes", {
          method: "POST",
          body: { map_id: mapId }
        });
        if (!isCleaned) setCodeList(response.codes || []);
      };
      ignoreAbort(fetchAddressList)();
      return () => {
        isCleaned = true;
      };
    }, [mapId]);

    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        setCodeList((items) => {
          const oldIndex = items.indexOf(active.id as string);
          const newIndex = items.indexOf(over.id as string);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    };

    const handleSave = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      await runAction(
        async () => {
          await callFunction("/map/codes/update", {
            method: "POST",
            body: {
              map: mapId,
              codes: codeList.map((code, index) => ({
                code,
                sequence: index
              }))
            }
          });
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    const activeIndex = activeId ? codeList.indexOf(activeId) : -1;

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          className={cn(contentProps.className, "sm:max-w-2xl")}
        >
          <DialogHeader>
            <DialogTitle>
              {t("map.updateMapSequence", "Update Map Sequence")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {codeList.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t(
                  "map.dragToReorder",
                  "Drag and drop the cards to reorder the sequence"
                )}
              </p>
            )}
            <ScrollArea className="max-h-[70dvh]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={codeList}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-1.5 rounded-md bg-muted p-3">
                    {codeList.map((code, index) => (
                      <SortableItem
                        key={code}
                        id={code}
                        code={code}
                        sequence={index + 1}
                      />
                    ))}
                  </div>
                </SortableContext>
                {createPortal(
                  <DragOverlay>
                    {activeId && activeIndex !== -1 ? (
                      <DragOverlayItem
                        code={activeId}
                        sequence={activeIndex + 1}
                      />
                    ) : null}
                  </DragOverlay>,
                  document.body
                )}
              </DndContext>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={footerSaveAcl}
              >
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t("common.save", "Save")}
                </Button>
              </ComponentAuthorizer>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default ChangeMapSequence;
