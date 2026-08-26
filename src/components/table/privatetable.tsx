import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { territorySingleProps } from "../../utils/interface";
import { DEFAULT_AGGREGATES, USER_ACCESS_LEVELS } from "../../utils/constants";
import AddressStatus, { PendingSyncDot } from "./address";
import ComponentAuthorizer from "../navigation/authorizer";
import * as m from "motion/react-m";
import { diagonalCell } from "@/lib/motion";
import useNextAvailable from "../../hooks/useNextAvailable";
import NextAvailable from "./nextavailable";

const PrivateTerritoryTable = ({
  houses,
  policy,
  addressDetails,
  handleHouseUpdate,
  handleAddMoreClick,
  pendingAddressIds
}: territorySingleProps) => {
  const aggregates = addressDetails?.aggregates;
  const { containerRef, remaining, targetId, goToNext } = useNextAvailable(
    houses?.units ?? [],
    policy
  );
  return (
    <div className={cn("relative", !policy.isFromAdmin() && "h-full")}>
      <div
        ref={containerRef}
        className={cn(
          policy.isFromAdmin() ? "map-body-admin" : "h-full overflow-auto",
          "p-2"
        )}
      >
        <div className="grid grid-cols-4 gap-1">
          {houses &&
            houses.units.map((element, index) => (
              <m.div
                key={`house-column-${element.id}`}
                className="min-w-0"
                custom={{ row: Math.floor(index / 4), col: index % 4 }}
                variants={diagonalCell}
                initial="hidden"
                animate="show"
              >
                <Card
                  className={cn(
                    "h-full overflow-visible gap-0 py-0",
                    element.id === targetId && "map-target-ring"
                  )}
                >
                  <CardContent
                    className="relative flex flex-1 flex-col p-0 text-center transition-colors duration-200"
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
                    {pendingAddressIds?.has(element.id) && <PendingSyncDot />}
                    <div
                      className="overflow-hidden px-[0.10rem] py-[0.10rem] text-ellipsis whitespace-nowrap leading-tight font-bold fluid-text"
                      title={element.number}
                    >
                      {element.number}
                    </div>
                    <div
                      className={cn(
                        "flex min-h-12 flex-1 flex-wrap items-center justify-center gap-[0.15rem] p-[0.2rem] font-bold fluid-text transition-colors duration-200 border-t border-border",
                        policy?.getUnitColor(
                          element,
                          aggregates?.value || DEFAULT_AGGREGATES.value
                        )
                      )}
                    >
                      <AddressStatus
                        key={`${element.status}-${element.nhcount}`}
                        type={element.type}
                        note={element.note}
                        status={element.status}
                        nhcount={element.nhcount}
                        defaultOption={policy?.defaultType}
                      />
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            ))}
          <ComponentAuthorizer
            requiredPermission={USER_ACCESS_LEVELS.PUBLISHER.CODE}
            userPermission={policy.userRole}
          >
            <div className="min-w-0">
              <Card
                onClick={() => handleAddMoreClick?.()}
                className="min-h-full cursor-pointer overflow-visible gap-0 py-0 opacity-60 transition-[opacity,transform] duration-150 ease-in-out hover:opacity-100 active:scale-[0.97]"
              >
                <CardContent className="flex min-h-[3.5rem] items-center justify-center p-0 text-center">
                  <span className="text-muted-foreground fluid-text leading-none">
                    +
                  </span>
                </CardContent>
              </Card>
            </div>
          </ComponentAuthorizer>
        </div>
      </div>
      <NextAvailable
        remaining={remaining}
        progress={aggregates?.value || DEFAULT_AGGREGATES.value}
        surface="admin"
        onClick={goToNext}
      />
    </div>
  );
};

export default PrivateTerritoryTable;
