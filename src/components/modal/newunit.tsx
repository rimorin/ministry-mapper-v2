import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { USER_ACCESS_LEVELS, TERRITORY_TYPES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { NewUnitModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import TagField from "../form/tagfield";
import { callFunction } from "../../utils/pocketbase";

interface UnitOption {
  value: string;
  label: string;
}

const NewUnit = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    addressData
  }: NewUnitModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const [unitTags, setUnitTags] = useState<UnitOption[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const isSingleStory = addressData.type === TERRITORY_TYPES.SINGLE_STORY;
    const unitType = isSingleStory ? "property" : "unit";

    const handleUnitChange = (newValue: readonly UnitOption[] | null) => {
      if (!newValue) {
        setUnitTags([]);
        return;
      }

      setUnitTags(newValue as UnitOption[]);
    };

    const handleCreateNewUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (unitTags.length === 0) {
        notifyWarning(t("unit.requireOneUnitValidation"));
        return;
      }

      setIsSaving(true);
      try {
        const codes = unitTags.map((tag) => tag.value);
        await callFunction("/map/code/add", {
          method: "POST",
          body: {
            map: mapId,
            codes
          }
        });
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {t(
              `unit.add${unitType.charAt(0).toUpperCase() + unitType.slice(1)}Title`,
              {
                name: addressData.name
              }
            )}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateNewUnit}>
          <Modal.Body>
            <TagField
              label={t(`unit.${unitType}NumberLabel`)}
              value={unitTags}
              onChange={handleUnitChange}
              placeholder={t("unit.placeholder")}
              noOptionsMessage={t("unit.noOptions")}
              formatCreateLabel={(inputValue) =>
                t("unit.add", { value: inputValue })
              }
            />
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default NewUnit;
