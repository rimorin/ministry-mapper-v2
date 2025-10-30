import { Badge } from "react-bootstrap";
import { STATUS_CODES } from "../../utils/constants";
import { typeInterface, unitProps } from "../../utils/interface";
import NotHomeIcon from "./nothome";

const status = (status: string) => {
  switch (status) {
    case STATUS_CODES.DONE:
      return "✅ ";
    case STATUS_CODES.DO_NOT_CALL:
      return "🚫 ";
    default:
      return "";
  }
};

const getHouseholdBadge = (type: typeInterface[], defaultOption: string) => {
  if (!type || type.length === 0) {
    return null;
  }

  const filteredTypes = type.filter((type) => type.id !== defaultOption);

  if (filteredTypes.length === 0) {
    return null;
  }

  return (
    <Badge bg="secondary" className="me-1" pill>
      {filteredTypes.map((type) => type.code).join(", ")}
    </Badge>
  );
};

const AddressStatus = (props: unitProps) => {
  const {
    type: householdType,
    note,
    status: currentStatus,
    nhcount,
    defaultOption = ""
  } = props;

  if (currentStatus === STATUS_CODES.INVALID) {
    return <span className="status-invalid">✖️</span>;
  }

  return (
    <>
      {currentStatus !== STATUS_CODES.NOT_HOME && <>{status(currentStatus)}</>}
      {currentStatus === STATUS_CODES.NOT_HOME && (
        <NotHomeIcon nhcount={nhcount} classProp={"me-1"} />
      )}
      {note && <>🗒️ </>}
      {getHouseholdBadge(householdType, defaultOption)}
    </>
  );
};

export default AddressStatus;
