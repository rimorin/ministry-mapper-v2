import { Modal } from "react-bootstrap";
import { DEFAULT_FLOOR_PADDING, TERRITORY_TYPES } from "../../utils/constants";
import { TitleProps } from "../../utils/interface";
import ZeroPad from "../../utils/helpers/zeropad";

const ModalUnitTitle = ({ unit, floor, name, type }: TitleProps) => {
  const isMultipleStories = type === TERRITORY_TYPES.MULTIPLE_STORIES;
  return (
    <Modal.Header
      key={`modal-title-${unit}-${floor}-${name}`}
      style={{ justifyContent: "space-between" }}
    >
      <Modal.Title>
        {isMultipleStories ? (
          <>
            <div>{name}</div>
            <div>{`# ${ZeroPad(floor.toString(), DEFAULT_FLOOR_PADDING)} - ${unit}`}</div>
          </>
        ) : (
          <>{`${unit}, ${name}`}</>
        )}
      </Modal.Title>
    </Modal.Header>
  );
};

export default ModalUnitTitle;
