import { memo } from "react";
import { STATUS_CODES } from "../../utils/constants";
import { unitProps } from "../../utils/interface";

const HouseStatus = memo((props: unitProps) => {
  const { status: currentStatus, nhcount } = props;

  const getStatusIcon = () => {
    switch (currentStatus) {
      case STATUS_CODES.INVALID:
        return "✖️";
      case STATUS_CODES.DONE:
        return "✅";
      case STATUS_CODES.DO_NOT_CALL:
        return "🚫";
      case STATUS_CODES.NOT_HOME:
        return nhcount?.toString() || "";
      default:
        return "";
    }
  };

  return <>{getStatusIcon()}</>;
});

export default HouseStatus;
