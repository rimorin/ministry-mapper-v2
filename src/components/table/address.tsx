import { memo } from "react";
import { Badge } from "react-bootstrap";
import { STATUS_CODES } from "../../utils/constants";
import { typeInterface, unitProps } from "../../utils/interface";
import NotHomeIcon from "./nothome";

const AddressStatus = memo((props: unitProps) => {
  const householdType = props.type;
  const note = props.note;
  const currentStatus = props.status;
  const nhcount = props.nhcount;
  const defaultOption = props.defaultOption || "";
  let status = "";

  if (currentStatus === STATUS_CODES.INVALID) {
    return <>✖️</>;
  }
  if (currentStatus === STATUS_CODES.DONE) {
    status = "✅ ";
  }

  if (currentStatus === STATUS_CODES.DO_NOT_CALL) {
    status = "🚫 ";
  }

  const getHouseholdBadge = (
    householdType: typeInterface[],
    defaultOption: string
  ) => {
    if (!householdType) {
      return <></>;
    }

    if (
      householdType &&
      householdType.length === 1 &&
      householdType?.[0]?.id === defaultOption
    ) {
      return <></>;
    }

    const filteredTypes = householdType.filter(
      (type) => type.id !== defaultOption
    );

    if (filteredTypes.length === 0) {
      return <></>;
    }

    return (
      <Badge bg="secondary" className="me-1" pill>
        {filteredTypes.map((type) => type.code).join(", ")}
      </Badge>
    );
  };

  return (
    <>
      {currentStatus !== STATUS_CODES.NOT_HOME && <>{status}</>}
      {currentStatus === STATUS_CODES.NOT_HOME && (
        <NotHomeIcon nhcount={nhcount} classProp={"me-1"} />
      )}
      {note && <>🗒️ </>}
      {getHouseholdBadge(householdType, defaultOption)}
    </>
  );
});

export default AddressStatus;
