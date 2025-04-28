import { memo } from "react";
import { Offcanvas, ListGroup } from "react-bootstrap";
import { TERRITORY_SELECTOR_VIEWPORT_HEIGHT } from "../../utils/constants";
import { TerritoryListingProps } from "../../utils/interface";
import AggregationBadge from "./aggrbadge";
import { useTranslation } from "react-i18next";

const TerritoryListing = memo(
  ({
    showListing,
    hideFunction,
    selectedTerritory,
    handleSelect,
    territories,
    hideSelectedTerritory = false
  }: TerritoryListingProps) => {
    const { t } = useTranslation();
    const currentTerritories = territories
      ? hideSelectedTerritory
        ? territories.filter((element) => element.code !== selectedTerritory)
        : territories
      : undefined;
    return (
      <Offcanvas
        placement={"bottom"}
        show={showListing}
        onHide={hideFunction}
        style={{ height: TERRITORY_SELECTOR_VIEWPORT_HEIGHT }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{t("territory.selectTerritory")}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ListGroup onSelect={handleSelect}>
            {currentTerritories &&
              currentTerritories.map((element) => (
                <ListGroup.Item
                  action
                  key={`list-group-item-${element.code}`}
                  eventKey={element.id}
                >
                  <div
                    style={{ justifyContent: "space-between", display: "flex" }}
                  >
                    <span className="fw-bold">
                      {element.code}: {element.name}
                    </span>
                    <AggregationBadge aggregate={element.aggregates} />
                  </div>
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
    );
  }
);

export default TerritoryListing;
