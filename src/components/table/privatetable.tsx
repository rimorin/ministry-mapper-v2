import { territorySingleProps } from "../../utils/interface";
import { DEFAULT_AGGREGATES } from "../../utils/constants";

import { Row, Col, Card } from "react-bootstrap";
import AddressStatus from "./address";
const PrivateTerritoryTable = ({
  houses,
  policy,
  addressDetails,
  handleHouseUpdate
}: territorySingleProps) => {
  const mapId = addressDetails?.id;
  const aggregates = addressDetails?.aggregates;
  return (
    <div
      key={`territory-table-${mapId}`}
      className={`${policy.isFromAdmin() ? "map-body-admin" : "map-body"} p-2`}
    >
      <Row xs={4} className="g-1">
        {houses &&
          houses.units.map((element) => (
            <Col key={`house-column-${element.id}`}>
              <Card bg="light" text="dark">
                <Card.Body
                  style={{
                    padding: "0",
                    textAlign: "center"
                  }}
                  onClick={handleHouseUpdate}
                  data-id={element.id}
                  data-unitno={element.number}
                  data-floor={houses.floor}
                  data-hhtype={element.type}
                  data-hhnote={element.note}
                  data-hhstatus={element.status}
                  data-nhcount={element.nhcount}
                  data-dnctime={element.dnctime}
                  data-sequence={element.sequence}
                >
                  <Card.Header
                    style={{ padding: "0.10rem" }}
                    className="fluid-bolding fluid-text"
                  >
                    {element.number}
                  </Card.Header>
                  <div
                    className={`landed-unit fluid-bolding fluid-text ${policy?.getUnitColor(
                      element,
                      aggregates?.value || DEFAULT_AGGREGATES.value
                    )}`}
                    style={{ padding: "0.3rem 0" }}
                  >
                    <AddressStatus
                      type={element.type}
                      note={element.note}
                      status={element.status}
                      nhcount={element.nhcount}
                      defaultOption={policy?.defaultType}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
    </div>
  );
};

export default PrivateTerritoryTable;
