import { DialogTitle } from "@mui/joy";
import { TERRITORY_TYPES, WIKI_CATEGORIES } from "../../utils/constants";
import { TitleProps } from "../../utils/interface";

const ModalUnitTitle = ({
  unit,
  propertyPostal,
  floorDisplay,
  postal,
  name,
  type
}: TitleProps) => {
  let titleString = `# ${floorDisplay} - ${unit}`;

  if (postal) {
    titleString = `${postal}, ${titleString}`;
  }

  if (type === TERRITORY_TYPES.PRIVATE) {
    titleString = `${unit}, ${name}`;
    if (propertyPostal) {
      titleString = `${titleString}, ${propertyPostal}`;
    }
  }
  return (
    <DialogTitle>{titleString}</DialogTitle>
    // <Modal.Header>
    //   <Modal.Title>{titleString}</Modal.Title>
    //   <HelpButton link={WIKI_CATEGORIES.UPDATE_UNIT_STATUS} />
    // </Modal.Header>
  );
};

export default ModalUnitTitle;
