import NiceModal, { bootstrapDialog, useModal } from "@ebay/nice-modal-react";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { TerritoryMapSequenceModalProps } from "../../utils/interface";
import { Form, Modal } from "react-bootstrap";
import ModalFooter from "../form/footer";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getList, updateDataById } from "../../utils/pocketbase";
import "../../css/sortable.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useNotification from "../../hooks/useNotification";

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
      <span className="sortable-item-sequence">{index + 1}</span>
      <span className="sortable-item-code">{label}</span>
    </div>
  );
};

const ChangeTerritoryMapSequence = NiceModal.create(
  ({
    territoryId,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: TerritoryMapSequenceModalProps) => {
    const modal = useModal();
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [mapList, setMapList] = useState<MapItem[]>([]);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );

    useEffect(() => {
      getList("maps", {
        filter: `territory = "${territoryId}"`,
        sort: "sequence",
        fields: "id,sequence,description",
        requestKey: null
      }).then((response) => setMapList(response as unknown as MapItem[]));
    }, [territoryId]);

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
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
      setIsSaving(true);
      try {
        await Promise.all(
          mapList.map((map, index) =>
            updateDataById(
              "maps",
              map.id,
              { sequence: index + 1 },
              { requestKey: null }
            )
          )
        );
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal
        {...bootstrapDialog(modal)}
        onHide={() => modal.remove()}
        size="lg"
      >
        <Modal.Header>
          <Modal.Title>
            {t("territory.updateMapSequence", "Update Map Sequence")}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className="sortable-modal-body">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mapList.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="sortable-list">
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

export default ChangeTerritoryMapSequence;
