import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import Calendar from "react-calendar";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import { ConfirmSlipDetailsModalProps } from "../../utils/interface";
import type { Value } from "react-calendar/dist/shared/types";
import useNotification from "../../hooks/useNotification";

const ConfirmSlipDetails = NiceModal.create(
  ({
    addressName,
    userAccessLevel,
    isPersonalSlip = true
  }: ConfirmSlipDetailsModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning } = useNotification();
    const modal = useModal();
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
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {isPersonalSlip
              ? t("slip.confirmPersonalTitle", { addressName })
              : t("slip.confirmRegularTitle", { addressName })}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitPersonalSlip}>
          <Modal.Body>
            {isPersonalSlip && (
              <Calendar
                //Block selection for current day and days before.
                minDate={new Date(Date.now() + 3600 * 1000 * 24)}
                onChange={(selectedDate: Value) => {
                  const selectedDateValue = selectedDate as Date;
                  const expiryInHours = Math.floor(
                    (selectedDateValue.getTime() - new Date().getTime()) /
                      (1000 * 60 * 60)
                  );
                  setLinkExpiryHrs(expiryInHours);
                }}
                className="w-100 mb-1"
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
          </Modal.Body>
          <ModalFooter
            handleClick={() => modal.hide()}
            userAccessLevel={userAccessLevel}
            requiredAcLForSave={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
            isSaving={false}
            submitLabel={t("slip.confirmButton")}
          />
        </Form>
      </Modal>
    );
  }
);

export default ConfirmSlipDetails;
