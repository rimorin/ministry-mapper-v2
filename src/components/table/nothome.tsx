import { memo } from "react";
import { nothomeProps } from "../../utils/interface";
import { Image } from "react-bootstrap";

const NotHomeIcon = memo(({ nhcount, classProp }: nothomeProps) => {
  let parentClass = "parent-nothome";
  if (classProp) parentClass += ` ${classProp}`;
  return (
    <div className={parentClass}>
      <div className="container-nothome">
        <Image
          fluid
          src="https://assets.ministry-mapper.com/envelope.svg"
          className="nothome-envelope"
        />
        {nhcount && <div className="badge-nothome">{nhcount}</div>}
      </div>
    </div>
  );
});
export default NotHomeIcon;
