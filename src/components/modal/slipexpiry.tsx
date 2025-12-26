import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal } from "react-bootstrap";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import ModalFooter from "../form/footer";
import { ExpiryButtonProp } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const calculateTimeLeft = (endTime: number) => {
  const diff = Math.max(endTime - Date.now(), 0);

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000)
  };
};

const ShowExpiry = NiceModal.create(({ endtime }: ExpiryButtonProp) => {
  const modal = useModal();
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endtime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endtime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endtime]);

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
      <Modal.Header style={{ display: "flex", justifyContent: "center" }}>
        <Modal.Title>
          {t("assignments.linkExpirationTimer", "Link Expiration Timer")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div>
          {days > 0 && `${days}${t("common.daysShort", "d")} `}
          {hours > 0 && `${hours}${t("common.hoursShort", "h")} `}
          {minutes > 0 && `${minutes}${t("common.minutesShort", "m")} `}
          {seconds > 0 && `${seconds}${t("common.secondsShort", "s")}`}
        </div>
      </Modal.Body>
      <ModalFooter
        handleClick={modal.hide}
        userAccessLevel={USER_ACCESS_LEVELS.READ_ONLY.CODE}
      />
    </Modal>
  );
});

export default ShowExpiry;
