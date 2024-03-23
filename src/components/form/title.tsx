// import { DialogTitle } from "@mui/joy";
import { DialogTitle } from "@mui/material";
import { TERRITORY_TYPES } from "../../utils/constants";
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
  return <DialogTitle>{titleString}</DialogTitle>;
};

export default ModalUnitTitle;
