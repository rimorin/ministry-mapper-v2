import { territorySingleProps } from "../../utils/interface";
import { DEFAULT_AGGREGATES, USER_ACCESS_LEVELS } from "../../utils/constants";
import { Row, Col, Card } from "react-bootstrap";
import AddressStatus from "./address";
import ComponentAuthorizer from "../navigation/authorizer";
const PrivateTerritoryTable = ({
  houses,
  policy,
  addressDetails,
  handleHouseUpdate,
  handleAddMoreClick
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
              <Card>
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
                    style={{
                      padding: "0.10rem",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
                    }}
                    title={element.number}
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
        <ComponentAuthorizer
          requiredPermission={USER_ACCESS_LEVELS.PUBLISHER.CODE}
          userPermission={policy.userRole}
        >
          <Col key="add-more-cell">
            <Card
              onClick={() => handleAddMoreClick?.()}
              style={{ minHeight: "100%" }}
              className="add-more-card"
            >
              <Card.Body
                style={{
                  padding: "0",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "3.5rem"
                }}
              >
                <span
                  className="text-muted fluid-text"
                  style={{ lineHeight: 1 }}
                >
                  +
                </span>
              </Card.Body>
            </Card>
          </Col>
        </ComponentAuthorizer>
      </Row>
    </div>
  );
};

export default PrivateTerritoryTable;
