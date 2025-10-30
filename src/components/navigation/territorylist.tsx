import { Offcanvas, ListGroup } from "react-bootstrap";
import { TERRITORY_SELECTOR_VIEWPORT_HEIGHT } from "../../utils/constants";
import { TerritoryListingProps } from "../../utils/interface";
import AggregationBadge from "./aggrbadge";
import { useTranslation } from "react-i18next";

const TerritoryListing = ({
  showListing,
  hideFunction,
  selectedTerritory,
  handleSelect,
  territories,
  hideSelectedTerritory = false
}: TerritoryListingProps) => {
  const { t } = useTranslation();
  const currentTerritories = !territories
    ? undefined
    : hideSelectedTerritory
      ? territories.filter((element) => element.code !== selectedTerritory)
      : territories;

  return (
    <Offcanvas
      placement="bottom"
      show={showListing}
      onHide={hideFunction}
      style={{
        height: TERRITORY_SELECTOR_VIEWPORT_HEIGHT,
        borderTopLeftRadius: "1rem",
        borderTopRightRadius: "1rem"
      }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>
            {t("territory.selectTerritory")}
          </span>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <ListGroup onSelect={handleSelect}>
          {currentTerritories && currentTerritories.length > 0 ? (
            currentTerritories.map((element) => (
              <ListGroup.Item
                action
                key={`list-group-item-${element.code}`}
                eventKey={element.id}
                className={element.code === selectedTerritory ? "active" : ""}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">
                    {element.code}: {element.name}
                  </span>
                  <AggregationBadge aggregate={element.aggregates} />
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📍</div>
              <div className="empty-state-title">
                {t("territory.noTerritories", "No Territories")}
              </div>
              <div className="empty-state-description">
                {t(
                  "territory.noTerritoriesDescription",
                  "No territories available to select"
                )}
              </div>
            </div>
          )}
        </ListGroup>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default TerritoryListing;
