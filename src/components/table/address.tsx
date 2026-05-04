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

const MAX_VISIBLE_BADGES = 2;

const getHouseholdBadge = (types: typeInterface[], defaultOption: string) => {
  const filtered = types?.filter((t) => t.id !== defaultOption);
  if (!filtered?.length) return null;

  const visible = filtered.slice(0, MAX_VISIBLE_BADGES);
  const overflow = filtered.length - MAX_VISIBLE_BADGES;
  const allCodes = filtered.map((t) => t.code).join(", ");
  const label =
    overflow > 0
      ? `${visible.map((t) => t.code).join(", ")} +${overflow}`
      : allCodes;

  return (
    <Badge bg="secondary" pill title={allCodes}>
      {label}
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

export const PendingSyncDot = () => (
  <span
    aria-label="pending smart sync"
    style={{
      position: "absolute",
      top: 3,
      right: 3,
      width: 7,
      height: 7,
      borderRadius: "50%",
      backgroundColor: "#fd7e14",
      pointerEvents: "none"
    }}
  />
);
