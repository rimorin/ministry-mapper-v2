import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal } from "react-bootstrap";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import ModalFooter from "../form/footer";
import { ExpiryButtonProp } from "../../utils/interface";
import Countdown from "react-countdown";
import { useTranslation } from "react-i18next";

const ShowExpiry = NiceModal.create(({ endtime }: ExpiryButtonProp) => {
  const modal = useModal();
  const { t } = useTranslation();

  return (
    <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
      <Modal.Header style={{ display: "flex", justifyContent: "center" }}>
        <Modal.Title>
          {t("assignments.linkExpirationTimer", "Link Expiration Timer")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <Countdown
          className="m-1"
          date={endtime}
          daysInHours={true}
          intervalDelay={100}
          precision={3}
          renderer={(props) => {
            const daysDisplay =
              props.days !== 0 ? (
                <>
                  {props.days} {t("common.daysShort", "d")}{" "}
                </>
              ) : (
                <></>
              );
            const hoursDisplay =
              props.hours !== 0 ? (
                <>
                  {props.hours} {t("common.hoursShort", "h")}{" "}
                </>
              ) : (
                <></>
              );
            const minsDisplay =
              props.minutes !== 0 ? (
                <>
                  {props.minutes} {t("common.minutesShort", "m")}{" "}
                </>
              ) : (
                <></>
              );
            const secondsDisplay =
              props.seconds !== 0 ? (
                <>
                  {props.seconds} {t("common.secondsShort", "s")}{" "}
                </>
              ) : (
                <></>
              );
            return (
              <div>
                {daysDisplay}
                {hoursDisplay}
                {minsDisplay}
                {secondsDisplay}
              </div>
            );
          }}
        />
      </Modal.Body>
      <ModalFooter
        handleClick={modal.hide}
        userAccessLevel={USER_ACCESS_LEVELS.READ_ONLY.CODE}
      />
    </Modal>
  );
});

export default ShowExpiry;
