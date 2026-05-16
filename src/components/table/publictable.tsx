import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { territoryMultiProps } from "../../utils/interface";
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

const PublicTerritoryTable = ({
  floors,
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
  const floorDetails = floors[0];
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
            {floorDetails?.units.map((item, index) => (
              <m.th
                key={`th-${index}-${item.number}`}
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
                      dataAttributes={{ unitno: item.number }}
                      label={t("table.deleteUnit", "🗑️")}
                    />
                  </ComponentAuthorizer>
                  <span>{ZeroPad(item.number, maxUnitLength)}</span>
                </div>
              </m.th>
            ))}
          </tr>
        </thead>
        <tbody>
          {floors.map((item, rowIndex) => (
            <tr key={`row-${rowIndex}-${item.floor}`} className="h-16">
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
                      requiredPermission={
                        USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                      }
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
                  <span>
                    {ZeroPad(item.floor.toString(), DEFAULT_FLOOR_PADDING)}
                  </span>
                </div>
              </m.th>
              {item.units.map((element, colIndex) => (
                <m.td
                  key={`td-${item.floor}-${element.number}`}
                  className={cn(
                    "map-cell",
                    policy?.getUnitColor(
                      element,
                      addressDetails.aggregates?.value ||
                        DEFAULT_AGGREGATES.value
                    )
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
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PublicTerritoryTable;
