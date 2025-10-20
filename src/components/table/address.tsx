import { memo, useMemo } from "react";
import { Badge } from "react-bootstrap";
import { STATUS_CODES } from "../../utils/constants";
import { unitProps } from "../../utils/interface";
import NotHomeIcon from "./nothome";

const AddressStatus = memo((props: unitProps) => {
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

  const status = useMemo(() => {
    switch (currentStatus) {
      case STATUS_CODES.DONE:
        return "✅ ";
      case STATUS_CODES.DO_NOT_CALL:
        return "🚫 ";
      default:
        return "";
    }
  }, [currentStatus]);

  const getHouseholdBadge = useMemo(() => {
    if (!householdType || householdType.length === 0) {
      return null;
    }

    const filteredTypes = householdType.filter(
      (type) => type.id !== defaultOption
    );

    if (filteredTypes.length === 0) {
      return null;
    }

    return (
      <Badge bg="secondary" className="me-1" pill>
        {filteredTypes.map((type) => type.code).join(", ")}
      </Badge>
    );
  }, [householdType, defaultOption]);

  return (
    <>
      {currentStatus !== STATUS_CODES.NOT_HOME && <>{status}</>}
      {currentStatus === STATUS_CODES.NOT_HOME && (
        <NotHomeIcon nhcount={nhcount} classProp={"me-1"} />
      )}
      {note && <>🗒️ </>}
      {getHouseholdBadge}
    </>
  );
});

export default AddressStatus;
