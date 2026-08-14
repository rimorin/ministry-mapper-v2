import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { floorDetails, territoryMultiProps } from "../../utils/interface";
import type { Policy } from "../../utils/policies";
import AddressStatus, { PendingSyncDot } from "./address";
import {
  DEFAULT_AGGREGATES,
  DEFAULT_FLOOR_PADDING,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import ZeroPad from "../../utils/helpers/zeropad";
import * as m from "motion/react-m";
import GenericButton from "../navigation/button";
import ComponentAuthorizer from "../navigation/authorizer";
import {
  diagonalCell,
  columnHeader,
  rowHeader,
  PAGE_ENTER_DELAY
} from "@/lib/motion";

interface FloorRowProps {
  item: floorDetails;
  columns: string[];
  rowIndex: number;
  moreThanOneFloor: boolean;
  aggregatesValue: number;
  policy: Policy;
  pendingAddressIds?: Set<string>;
  handleUnitStatusUpdate: (event: React.MouseEvent<HTMLElement>) => void;
  handleFloorDelete?: (event: React.MouseEvent<HTMLElement>) => void;
}

// One floor per component so the React Compiler can bail out of rows whose
// floor object is unchanged (useFloorList keeps untouched floors referentially
// stable). A realtime event then re-renders one row instead of the whole grid.
const FloorRow = ({
  item,
  columns,
  rowIndex,
  moreThanOneFloor,
  aggregatesValue,
  policy,
  pendingAddressIds,
  handleUnitStatusUpdate,
  handleFloorDelete
}: FloorRowProps) => {
  const { t } = useTranslation();
  const unitsByNumber = new Map(item.units.map((unit) => [unit.number, unit]));
  return (
    <tr className="h-16">
      <m.th
        className="sticky-left-cell text-center align-middle text-xs text-muted-foreground tracking-wide"
        scope="row"
        custom={{ index: rowIndex }}
        variants={rowHeader}
        initial="hidden"
        animate="show"
      >
        <div className="inline-flex items-center">
          {moreThanOneFloor && (
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={policy?.userRole}
            >
              <GenericButton
                size="sm"
                variant="secondary"
                className="me-1"
                onClick={handleFloorDelete}
                dataAttributes={{ floor: item.floor.toString() }}
                label={t("table.deleteFloor", "🗑️")}
              />
            </ComponentAuthorizer>
          )}
          <span>{ZeroPad(item.floor.toString(), DEFAULT_FLOOR_PADDING)}</span>
        </div>
      </m.th>
      {columns.map((unitNumber, colIndex) => {
        // Look the unit up by its number rather than taking whatever sits at
        // this position in the floor's own list. Position-based rendering put
        // cells under the wrong header whenever a floor ordered its units
        // differently from the floor the headers were read from.
        const element = unitsByNumber.get(unitNumber);

        if (!element) {
          return (
            <td
              key={`td-${item.floor}-${unitNumber}`}
              className="map-cell"
              aria-hidden="true"
            />
          );
        }

        return (
          <m.td
            key={`td-${item.floor}-${unitNumber}`}
            className={cn(
              "map-cell",
              policy?.getUnitColor(element, aggregatesValue)
            )}
            onClick={handleUnitStatusUpdate}
            data-id={element.id}
            data-floor={item.floor}
            data-unitno={element.number}
            custom={{ row: rowIndex, col: colIndex }}
            variants={diagonalCell}
            initial="hidden"
            animate="show"
          >
            <div className="relative w-full h-full">
              {pendingAddressIds?.has(element.id) && <PendingSyncDot />}
              <AddressStatus
                key={`${element.status}-${element.nhcount}`}
                type={element.type}
                note={element.note}
                status={element.status}
                nhcount={element.nhcount}
                defaultOption={policy?.defaultType}
              />
            </div>
          </m.td>
        );
      })}
    </tr>
  );
};

const PublicTerritoryTable = ({
  floors,
  columns,
  addressDetails,
  policy,
  maxUnitLength,
  pendingAddressIds,
  handleUnitStatusUpdate,
  handleFloorDelete,
  handleUnitDelete
}: territoryMultiProps) => {
  const { t } = useTranslation();
  const moreThanOneFloor = floors.length > 1;
  const aggregatesValue =
    addressDetails.aggregates?.value || DEFAULT_AGGREGATES.value;
  return (
    <div
      className={cn(
        policy.isFromAdmin() ? "map-body-admin" : "h-full map-body"
      )}
    >
      <table className="sticky-table w-full text-sm">
        <thead>
          <tr className="h-16">
            <m.th
              scope="col"
              className="sticky-top-cell sticky-left-cell sticky-corner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.25,
                ease: "linear",
                delay: PAGE_ENTER_DELAY
              }}
            />
            {columns.map((unitNumber, index) => (
              <m.th
                key={`th-${unitNumber}`}
                scope="col"
                className="sticky-top-cell text-center align-middle text-xs text-muted-foreground tracking-wide uppercase"
                custom={{ index }}
                variants={columnHeader}
                initial="hidden"
                animate="show"
              >
                <div className="inline-flex items-center">
                  <ComponentAuthorizer
                    requiredPermission={
                      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                    }
                    userPermission={policy?.userRole}
                  >
                    <GenericButton
                      size="sm"
                      variant="secondary"
                      className="me-1"
                      onClick={handleUnitDelete}
                      dataAttributes={{ unitno: unitNumber }}
                      label={t("table.deleteUnit", "🗑️")}
                    />
                  </ComponentAuthorizer>
                  <span>{ZeroPad(unitNumber, maxUnitLength)}</span>
                </div>
              </m.th>
            ))}
          </tr>
        </thead>
        <tbody>
          {floors.map((item, rowIndex) => (
            <FloorRow
              key={`row-${item.floor}`}
              item={item}
              columns={columns}
              rowIndex={rowIndex}
              moreThanOneFloor={moreThanOneFloor}
              aggregatesValue={aggregatesValue}
              policy={policy}
              pendingAddressIds={pendingAddressIds}
              handleUnitStatusUpdate={handleUnitStatusUpdate}
              handleFloorDelete={handleFloorDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PublicTerritoryTable;
