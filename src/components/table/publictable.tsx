// import { Table } from "react-bootstrap";
import { territoryTableProps } from "../../utils/interface";
import TableHeader from "./header";
import FloorHeader from "./floor";
import UnitStatus from "./unit";
import { Box, IconButton, Sheet, Table, Typography } from "@mui/joy";
import ZeroPad from "../../utils/helpers/zeropad";
import {
  DEFAULT_FLOOR_PADDING,
  DEFAULT_UNIT_DNC_MS_TIME,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import ComponentAuthorizer from "../navigation/authorizer";
import DeleteIcon from "@mui/icons-material/Delete";
const PublicTerritoryTable = ({
  postalCode,
  floors,
  maxUnitNumberLength,
  completedPercent,
  policy: hhPolicy,
  userAccessLevel,
  handleFloorDelete,
  handleUnitNoUpdate,
  handleUnitStatusUpdate
}: territoryTableProps) => (
  <Sheet
  // sx={{
  //   padding: "0.5rem",
  //   display: "flex",
  //   justifyContent: "center",
  //   overflow: "auto"
  // }}
  >
    <Table stickyHeader hoverRow stripe="odd" borderAxis="both">
      {/* <TableHeader floors={floors} maxUnitNumber={maxUnitNumberLength} /> */}
      <thead>
        <tr>
          <th
            style={{
              width: 100,
              height: 50,
              textAlign: "center",
              verticalAlign: "middle",
              // position: "sticky",
              left: 0,
              zIndex: 101
            }}
            scope="col"
            // className="text-center align-middle sticky-left-cell"
          >
            lvl/unit
          </th>
          {floors.length > 0 &&
            floors[0].units.map((item, index) => {
              return (
                <th
                  style={{
                    width: 80,
                    height: 50,
                    textAlign: "center",
                    verticalAlign: "middle"
                  }}
                  key={`${index}-${item.number}`}
                  scope="col"
                  onClick={
                    userAccessLevel ===
                    USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                      ? handleUnitNoUpdate
                      : undefined
                  }
                  data-length={floors[0].units.length}
                  data-sequence={item.sequence}
                  data-unitno={item.number}
                >
                  {ZeroPad(item.number, maxUnitNumberLength)}
                </th>
              );
            })}
        </tr>
      </thead>
      <tbody key={`tbody-${postalCode}`}>
        {floors &&
          floors.map((floorElement, floorIndex) => (
            <tr key={`row-${floorIndex}`}>
              <th
                key={`floor-${floorIndex}`}
                scope="row"
                style={{
                  width: 100,
                  height: 60,
                  position: "sticky",
                  left: 0,
                  zIndex: 100
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <ComponentAuthorizer
                    requiredPermission={
                      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
                    }
                    userPermission={userAccessLevel}
                  >
                    <IconButton
                      onClick={handleFloorDelete}
                      data-floor={floorElement.floor}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ComponentAuthorizer>
                  <Typography level="body-sm">{`${ZeroPad(
                    floorElement.floor.toString(),
                    DEFAULT_FLOOR_PADDING
                  )}`}</Typography>
                </Box>
              </th>
              {floorElement.units.map((detailsElement, index) => (
                <td
                  style={{
                    width: 80,
                    height: 60,
                    textAlign: "center",
                    verticalAlign: "middle"
                  }}
                  // className={`inline-cell ${policy?.getUnitColor(
                  //   detailsElement,
                  //   completedPercent.completedValue
                  // )}`}
                  onClick={handleUnitStatusUpdate}
                  key={`${index}-${detailsElement.number}`}
                  data-floor={floorElement.floor}
                  data-unitno={detailsElement.number}
                  data-hhtype={detailsElement.type}
                  data-hhnote={detailsElement.note}
                  data-hhstatus={detailsElement.status}
                  data-nhcount={detailsElement.nhcount}
                  data-addressid={detailsElement.addressId}
                  data-postal={detailsElement.propertyPostal}
                  data-dnctime={
                    detailsElement.dnctime || DEFAULT_UNIT_DNC_MS_TIME
                  }
                >
                  <UnitStatus
                    key={`unit-${index}-${detailsElement.number}`}
                    type={detailsElement.type}
                    note={detailsElement.note}
                    status={detailsElement.status}
                    nhcount={detailsElement.nhcount}
                    defaultOption={hhPolicy?.defaultType}
                  />
                </td>
              ))}
            </tr>
          ))}
      </tbody>
      {/* <tbody>
      {floors &&
        floors.map((item, index) => (
          <tr key={`row-${index}`}>
            <FloorHeader index={index} floor={item.floor} />
            {item.units.map((element) => (
              <td
                className={`text-center align-middle inline-cell ${hhPolicy?.getUnitColor(
                  element,
                  completedPercent.completedValue
                )}`}
                onClick={handleUnitStatusUpdate}
                data-floor={item.floor}
                data-unitno={element.number}
                data-addressid={element.addressId}
                key={`${item.floor}-${element.number}`}
              >
                <UnitStatus
                  type={element.type}
                  note={element.note}
                  status={element.status}
                  nhcount={element.nhcount}
                  defaultOption={hhPolicy?.defaultType}
                />
              </td>
            ))}
          </tr>
        ))}
    </tbody> */}
    </Table>
  </Sheet>
);

export default PublicTerritoryTable;
