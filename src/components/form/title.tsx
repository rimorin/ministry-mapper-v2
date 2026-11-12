import {
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from "@/components/common/responsive-dialog";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_FLOOR_PADDING, TERRITORY_TYPES } from "../../utils/constants";
import { TitleProps } from "../../utils/interface";
import ZeroPad from "../../utils/helpers/zeropad";

const ModalUnitTitle = ({ unit, floor, name, type }: TitleProps) => {
  const isMultipleStories = type === TERRITORY_TYPES.MULTIPLE_STORIES;
  const titleText = isMultipleStories
    ? `${name} — #${ZeroPad(floor.toString(), DEFAULT_FLOOR_PADDING)}-${unit}`
    : `${unit}, ${name}`;
  return (
    <>
      <ResponsiveDialogHeader
        key={`modal-title-${unit}-${floor}-${name}`}
        className="text-left"
      >
        <ResponsiveDialogTitle className="truncate text-[clamp(0.85rem,3.5vw,1.125rem)] leading-snug">
          {titleText}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <Separator />
    </>
  );
};

export default ModalUnitTitle;
