import { memo } from "react";
import { STATUS_CODES } from "../../utils/constants";
import { unitProps } from "../../utils/interface";

const HouseStatus = memo((props: unitProps) => {
  const currentStatus = props.status;
  const nhcount = props.nhcount;
  let status = "";

  if (currentStatus === STATUS_CODES.INVALID) {
    return <>✖️</>;
  }
  if (currentStatus === STATUS_CODES.DONE) {
    status = "✅";
  }

  if (currentStatus === STATUS_CODES.DO_NOT_CALL) {
    status = "🚫";
  }

  if (currentStatus === STATUS_CODES.NOT_HOME) {
    status = nhcount?.toString() || "";
  }

  return <>{status}</>;
});

export default HouseStatus;
