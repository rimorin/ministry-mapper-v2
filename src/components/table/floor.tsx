import { DEFAULT_FLOOR_PADDING } from "../../utils/constants";
import ZeroPad from "../../utils/helpers/zeropad";
import { floorHeaderProp } from "../../utils/interface";

const FloorHeader = ({ index, floor }: floorHeaderProp) => (
  <th
    className="sticky-left-cell text-center align-middle"
    key={`${index}-${floor}`}
    scope="row"
  >
    {ZeroPad(floor.toString(), DEFAULT_FLOOR_PADDING)}
  </th>
);
export default FloorHeader;
