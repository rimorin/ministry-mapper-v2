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
import { Calendar } from "@/components/ui/calendar";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import GenericInputField from "../form/input";
import { ConfirmSlipDetailsModalProps } from "../../utils/interface";
import useNotification from "../../hooks/useNotification";
import ComponentAuthorizer from "../navigation/authorizer";

const ConfirmSlipDetails = NiceModal.create(
  ({
    addressName,
    userAccessLevel,
    isPersonalSlip = true
  }: ConfirmSlipDetailsModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning } = useNotification();
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const [linkExpiryHrs, setLinkExpiryHrs] = useState<number | undefined>();
    const [name, setName] = useState<string>("");

    const handleSubmitPersonalSlip = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      if (!linkExpiryHrs && isPersonalSlip) {
        notifyWarning(t("slip.selectExpiryValidation"));
        return;
      }
      modal.resolve({ linkExpiryHrs: linkExpiryHrs, publisherName: name });
      modal.hide();
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>
              {isPersonalSlip
                ? t("slip.confirmPersonalTitle", { addressName })
                : t("slip.confirmRegularTitle", { addressName })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPersonalSlip} className="space-y-4">
            <div>
              {isPersonalSlip && (
                <Calendar
                  mode="single"
                  disabled={{ before: new Date(Date.now() + 3600 * 1000 * 24) }}
                  onSelect={(selectedDate) => {
                    if (!selectedDate) return;
                    const expiryInHours = Math.floor(
                      (selectedDate.getTime() - new Date().getTime()) /
                        (1000 * 60 * 60)
                    );
                    setLinkExpiryHrs(expiryInHours);
                  }}
                  className="mb-1 w-full rounded-md border [--cell-size:--spacing(10)]"
                />
              )}
              <GenericInputField
                label={t("slip.publisherNameLabel")}
                name="name"
                handleChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setName(value);
                }}
                placeholder={t("slip.publisherNamePlaceholder")}
                changeValue={name}
                focus={true}
                required={true}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                userPermission={userAccessLevel}
              >
                <Button type="submit">{t("slip.confirmButton")}</Button>
              </ComponentAuthorizer>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default ConfirmSlipDetails;
