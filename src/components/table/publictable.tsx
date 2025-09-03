import { Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { territoryMultiProps } from "../../utils/interface";
import AddressStatus from "./address";
import {
  DEFAULT_AGGREGATES,
  DEFAULT_FLOOR_PADDING,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import ZeroPad from "../../utils/helpers/zeropad";
import { memo } from "react";
import GenericButton from "../navigation/button";
import ComponentAuthorizer from "../navigation/authorizer";

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
    const floorDetails = floors?.[0];
    const totalUnits = floorDetails?.units?.length || 1;
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
                floorDetails &&
                floorDetails.units.map((item, index) => (
                  <th
                    key={`th-${index}-${item.number}`}
                    scope="col"
                    className="text-center align-middle"
                    onClick={handleUnitNoUpdate}
                    data-id={item.id}
                    data-floor={floorDetails.floor}
                    data-totalunits={totalUnits}
                  >
                    {ZeroPad(item.number, maxUnitLength)}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {floors &&
              floors.map((item, index) => (
                <tr key={`row-${index}-${item.floor}`} className="inline-row">
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
                        <GenericButton
                          size="sm"
                          variant="outline-warning"
                          className="me-1"
                          onClick={handleFloorDelete}
                          dataAttributes={{ floor: item.floor.toString() }}
                          label={t("table.deleteFloor", "🗑️")}
                        />
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
                      key={`td-${item.floor}-${element.number}`}
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
