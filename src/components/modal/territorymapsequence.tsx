import NiceModal from "@ebay/nice-modal-react";
import { USER_ACCESS_LEVELS, PB_FIELDS } from "../../utils/constants";
import { TerritoryMapSequenceModalProps } from "../../utils/interface";
import { createPortal } from "react-dom";
import { GripVertical } from "lucide-react";
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
import { getList, callFunction, isAbortError } from "../../utils/pocketbase";
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
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import useNotification from "../../hooks/useNotification";
import ComponentAuthorizer from "../navigation/authorizer";

interface MapItem {
  id: string;
  sequence: number;
  description: string;
}

const SortableItem = ({
  id,
  label,
  index
}: {
  id: string;
  label: string;
  index: number;
}) => {
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
      custom={{ delayIndex: index }}
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
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold leading-none text-primary-foreground">
          {index + 1}
        </span>
        <span className="flex-1 text-[0.95rem] font-semibold text-foreground">
          {label}
        </span>
      </div>
    </motion.div>
  );
};

const DragOverlayItem = ({
  label,
  index
}: {
  label: string;
  index: number;
}) => (
  <div className="sortable-item sortable-item-dragging flex cursor-grabbing touch-none select-none items-center gap-2 rounded-lg border border-[#e0e0e0] bg-background px-3 py-2 shadow-[0_2px_4px_rgba(0,0,0,0.075)]">
    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold leading-none text-primary-foreground">
      {index + 1}
    </span>
    <span className="flex-1 text-[0.95rem] font-semibold text-foreground">
      {label}
    </span>
  </div>
);

const ChangeTerritoryMapSequence = NiceModal.create(
  ({
    territoryId,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: TerritoryMapSequenceModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [mapList, setMapList] = useState<MapItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );

    useEffect(() => {
      let isCleaned = false;
      getList("maps", {
        filter: `territory="${territoryId}"`,
        sort: "sequence",
        fields: PB_FIELDS.MAPS_SEQUENCE,
        requestKey: null
      })
        .then((response) => {
          if (!isCleaned) setMapList(response as unknown as MapItem[]);
        })
        .catch((err) => {
          if (!isAbortError(err)) console.error(err);
        });
      return () => {
        isCleaned = true;
      };
    }, [territoryId]);

    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (over && active.id !== over.id) {
        setMapList((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    };

    const handleSave = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      await runAction(
        async () => {
          await callFunction("/maps/sequence", {
            method: "POST",
            body: {
              territory_id: territoryId,
              map_ids: mapList.map((m) => m.id)
            }
          });
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    const activeIndex = activeId
      ? mapList.findIndex((item) => item.id === activeId)
      : -1;
    const dragOverlayContent =
      activeIndex !== -1 ? (
        <DragOverlayItem
          label={mapList[activeIndex].description}
          index={activeIndex}
        />
      ) : null;

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...contentProps}
          className={cn(contentProps.className, "sm:max-w-2xl")}
        >
          <DialogHeader>
            <DialogTitle>
              {t("territory.updateMapSequence", "Update Map Sequence")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <ScrollArea className="max-h-[70dvh]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={mapList.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1.5 rounded-md bg-muted p-3">
                    {mapList.map((item, index) => (
                      <SortableItem
                        key={item.id}
                        id={item.id}
                        label={item.description}
                        index={index}
                      />
                    ))}
                  </div>
                </SortableContext>
                {createPortal(
                  <DragOverlay>{dragOverlayContent}</DragOverlay>,
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

export default ChangeTerritoryMapSequence;
