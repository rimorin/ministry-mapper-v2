import { nothomeProps } from "../../utils/interface";
import { getAssetUrl } from "../../utils/helpers/assetpath";

const NotHomeIcon = ({ nhcount, classProp }: nothomeProps) => {
  let parentClass = "parent-nothome";
  if (classProp) parentClass += ` ${classProp}`;
  return (
    <div className={parentClass}>
      <div className="container-nothome">
        <img
          src={getAssetUrl("envelope.svg")}
          className="nothome-envelope"
          alt=""
        />
        {nhcount && <div className="badge-nothome">{nhcount}</div>}
      </div>
    </div>
  );
};
export default NotHomeIcon;
