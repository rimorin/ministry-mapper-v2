import NiceModal, { bootstrapDialog, useModal } from "@ebay/nice-modal-react";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { MapSequenceUpdateModalProps } from "../../utils/interface";
import { Form, Image, Modal } from "react-bootstrap";
import ModalFooter from "../form/footer";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { callFunction } from "../../utils/pocketbase";
import { getAssetUrl } from "../../utils/helpers/assetpath";
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
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-item"
      {...attributes}
      {...listeners}
    >
      <span className="sortable-item-sequence">{sequence}</span>
      <span className="sortable-item-code">{code}</span>
    </div>
  );
};

const DragOverlayItem = ({
  code,
  sequence
}: {
  code: string;
  sequence: number;
}) => {
  return (
    <div className="sortable-item sortable-item-dragging">
      <span className="sortable-item-sequence">{sequence}</span>
      <span className="sortable-item-code">{code}</span>
    </div>
  );
};

const ChangeMapSequence = NiceModal.create(
  ({
    mapId,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: MapSequenceUpdateModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();
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
      const fetchAddressList = async () => {
        const response = await callFunction("/map/codes", {
          method: "POST",
          body: { map_id: mapId }
        });
        setCodeList(response.codes || []);
      };
      fetchAddressList();
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
      setIsSaving(true);
      try {
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
      } catch (error) {
        console.error("Failed to update sequence:", error);
      } finally {
        setIsSaving(false);
      }
    };

    const activeIndex = activeId ? codeList.indexOf(activeId) : -1;

    return (
      <Modal
        {...bootstrapDialog(modal)}
        onHide={() => modal.remove()}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {t("map.updateMapSequence", "Update Map Sequence")}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className="sortable-modal-body">
            {codeList.length > 0 && (
              <div className="sortable-instructions">
                <Image
                  src={getAssetUrl("information.svg")}
                  alt="Information"
                  width={16}
                  height={16}
                  style={{ display: "inline-block", marginRight: "0.5rem" }}
                />
                {t(
                  "map.dragToReorder",
                  "Drag and drop the cards to reorder the sequence"
                )}
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={codeList} strategy={rectSortingStrategy}>
                <div className="sortable-grid">
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
              <DragOverlay>
                {activeId && activeIndex !== -1 ? (
                  <DragOverlayItem code={activeId} sequence={activeIndex + 1} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            requiredAcLForSave={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default ChangeMapSequence;
