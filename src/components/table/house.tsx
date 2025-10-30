import { STATUS_CODES } from "../../utils/constants";
import { unitProps } from "../../utils/interface";

const getStatusIcon = (status: string, nhcount = "") => {
  switch (status) {
    case STATUS_CODES.INVALID:
      return "✖️";
    case STATUS_CODES.DONE:
      return "✅";
    case STATUS_CODES.DO_NOT_CALL:
      return "🚫";
    case STATUS_CODES.NOT_HOME:
      return nhcount;
    default:
      return "";
  }
};
const HouseStatus = (props: unitProps) => {
  const { status, nhcount } = props;

  return <>{getStatusIcon(status, nhcount)}</>;
};

export default HouseStatus;
