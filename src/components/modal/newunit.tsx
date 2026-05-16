import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useState, FormEvent } from "react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { USER_ACCESS_LEVELS, TERRITORY_TYPES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { NewUnitModalProps } from "../../utils/interface";
import TagField from "../form/tagfield";
import { callFunction } from "../../utils/pocketbase";
import ComponentAuthorizer from "../navigation/authorizer";

const NewUnit = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    mapId,
    addressData
  }: NewUnitModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const [unitTags, setUnitTags] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { modal, dialogProps, contentProps } = useBaseUiDialog();

    const isSingleStory = addressData.type === TERRITORY_TYPES.SINGLE_STORY;
    const unitType = isSingleStory ? "property" : "unit";

    const handleCreateNewUnit = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (unitTags.length === 0) {
        notifyWarning(t("unit.requireOneUnitValidation"));
        return;
      }

      await runAction(
        async () => {
          await callFunction("/map/code/add", {
            method: "POST",
            body: { map: mapId, codes: unitTags }
          });
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };
    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {t(
                `unit.add${unitType.charAt(0).toUpperCase() + unitType.slice(1)}Title`,
                {
                  name: addressData.name
                }
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNewUnit} className="space-y-4">
            <TagField
              label={t(`unit.${unitType}NumberLabel`)}
              value={unitTags}
              onChange={setUnitTags}
              placeholder={t("unit.placeholder")}
              noOptionsMessage={t("unit.noOptions")}
              formatCreateLabel={(inputValue) =>
                t("unit.add", { value: inputValue })
              }
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <ComponentAuthorizer
                requiredPermission={footerSaveAcl}
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

export default NewUnit;
