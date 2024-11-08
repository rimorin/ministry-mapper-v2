import { Modal } from "react-bootstrap";
import {
  DEFAULT_FLOOR_PADDING,
  TERRITORY_TYPES,
  WIKI_CATEGORIES
} from "../../utils/constants";
import { TitleProps } from "../../utils/interface";
import HelpButton from "../navigation/help";
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
      <HelpButton link={WIKI_CATEGORIES.UPDATE_UNIT_STATUS} />
    </Modal.Header>
  );
};

export default ModalUnitTitle;
