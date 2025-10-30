import { nothomeProps } from "../../utils/interface";
import { Image } from "react-bootstrap";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const NotHomeIcon = ({ nhcount, classProp }: nothomeProps) => {
  let parentClass = "parent-nothome";
  if (classProp) parentClass += ` ${classProp}`;
  return (
    <div className={parentClass}>
      <div className="container-nothome">
        <Image
          fluid
          src={getAssetUrl("envelope.svg")}
          className="nothome-envelope"
        />
        {nhcount && <div className="badge-nothome">{nhcount}</div>}
      </div>
    </div>
  );
};
export default NotHomeIcon;
