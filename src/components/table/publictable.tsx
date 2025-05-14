import { Button, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { territoryMultiProps } from "../../utils/interface";
import AddressStatus from "./address";
import {
  DEFAULT_AGGREGATES,
  DEFAULT_FLOOR_PADDING,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import ComponentAuthorizer from "../navigation/authorizer";
import ZeroPad from "../../utils/helpers/zeropad";
import { memo } from "react";

const PublicTerritoryTable = memo(
  ({
    floors,
    addressDetails,
    policy,
    maxUnitLength,
    handleUnitStatusUpdate,
    handleFloorDelete,
    handleUnitNoUpdate
  }: territoryMultiProps) => {
    const { t } = useTranslation();
    const moreThanOneFloor = floors.length > 1;
    return (
      <div
        className={policy.isFromAdmin() ? "sticky-body-admin" : "sticky-body"}
      >
        <Table
          bordered
          striped
          hover
          className="sticky-table"
          key={`table-${addressDetails.id}`}
        >
          <thead className="sticky-top-cell">
            <tr className="inline-row">
              <th
                scope="col"
                className="text-center align-middle sticky-left-cell"
              >
                {t("table.levelUnit", "lvl/unit")}
              </th>
              {floors &&
                floors?.[0]?.units.map((item, index) => (
                  <th
                    key={`${index}-${item.number}`}
                    scope="col"
                    className="text-center align-middle"
                    onClick={handleUnitNoUpdate}
                    data-id={item.id}
                    data-floor={floors?.[0]?.floor}
                  >
                    {ZeroPad(item.number, maxUnitLength)}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {floors &&
              floors.map((item, index) => (
                <tr key={`row-${index}`} className="inline-row">
                  <th
                    className="sticky-left-cell text-center align-middle"
                    key={`${index}-${item.floor}`}
                    scope="row"
                  >
                    {moreThanOneFloor && (
                      <ComponentAuthorizer
                        requiredPermission={
                          USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                        }
                        userPermission={policy?.userRole}
                      >
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="me-1"
                          onClick={handleFloorDelete}
                          data-floor={item.floor}
                        >
                          {t("table.deleteFloor", "🗑️")}
                        </Button>
                      </ComponentAuthorizer>
                    )}
                    {ZeroPad(item.floor.toString(), DEFAULT_FLOOR_PADDING)}
                  </th>
                  {item.units.map((element) => (
                    <td
                      className={`text-center align-middle inline-cell ${policy?.getUnitColor(
                        element,
                        addressDetails.aggregates?.value ||
                          DEFAULT_AGGREGATES.value
                      )}`}
                      onClick={handleUnitStatusUpdate}
                      data-id={element.id}
                      data-floor={item.floor}
                      data-unitno={element.number}
                      key={`${item.floor}-${element.number}`}
                    >
                      <AddressStatus
                        type={element.type}
                        note={element.note}
                        status={element.status}
                        nhcount={element.nhcount}
                        defaultOption={policy?.defaultType}
                      />
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    );
  }
);

export default PublicTerritoryTable;
