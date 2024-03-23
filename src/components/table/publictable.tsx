import { territoryTableProps } from "../../utils/interface";
import UnitStatus from "./unit";
// import { Box, IconButton, Sheet, Table, Typography } from "@mui/joy";
import ZeroPad from "../../utils/helpers/zeropad";
import {
  DEFAULT_FLOOR_PADDING,
  DEFAULT_UNIT_DNC_MS_TIME,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import ComponentAuthorizer from "../navigation/authorizer";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
const PublicTerritoryTable = ({
  postalCode,
  floors,
  maxUnitNumberLength,
  policy,
  completedPercent,
  userAccessLevel,
  handleFloorDelete,
  handleUnitNoUpdate,
  handleUnitStatusUpdate
}: territoryTableProps) => {
  const isAdmin = userAccessLevel === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;
  return (
    <TableContainer
      sx={{
        // padding: "0.5rem",
        // display: "flex",
        // justifyContent: "center",
        overflow: "auto",
        maxHeight: 300,
        width: "100%",
        overflowX: "auto"
      }}
    >
      <Table stickyHeader>
        {/* <TableHeader floors={floors} maxUnitNumber={maxUnitNumberLength} /> */}
        <TableHead>
          <TableRow>
            <TableCell
              style={{
                width: 100,
                height: 50,
                textAlign: "center",
                verticalAlign: "middle",
                left: 0,
                zIndex: 101,
                border: "0.5px solid #000"
              }}
              scope="col"
            >
              lvl/unit
            </TableCell>
            {floors.length > 0 &&
              floors[0].units.map((item, index) => {
                return (
                  <TableCell
                    style={{
                      width: 100,
                      // height: 50,
                      textAlign: "center",
                      verticalAlign: "middle",
                      cursor: isAdmin ? "pointer" : "default",
                      border: "0.5px solid #000"
                    }}
                    key={`${index}-${item.number}`}
                    scope="col"
                    onClick={isAdmin ? handleUnitNoUpdate : undefined}
                    data-length={floors[0].units.length}
                    data-sequence={item.sequence}
                    data-unitno={item.number}
                  >
                    <Typography
                      sx={
                        isAdmin
                          ? {
                              "&:hover": {
                                color: "red"
                              }
                            }
                          : undefined
                      }
                    >
                      {ZeroPad(item.number, maxUnitNumberLength)}
                    </Typography>
                  </TableCell>
                );
              })}
          </TableRow>
        </TableHead>
        <TableBody key={`tbody-${postalCode}`}>
          {floors &&
            floors.map((floorElement, floorIndex) => (
              <TableRow key={`row-${floorIndex}`}>
                {/* <TableHead
                  key={`floor-${floorIndex}`}
                  // scope="row"
                  style={{
                    // width: 100,
                    height: 60
                  }}
                > */}
                <TableCell
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "0.5px solid #000",
                    position: "sticky",
                    left: 0,
                    zIndex: 100
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
                  <Typography variant="body1">{`${ZeroPad(
                    floorElement.floor.toString(),
                    DEFAULT_FLOOR_PADDING
                  )}`}</Typography>
                </TableCell>
                {/* </TableHead> */}
                {floorElement.units.map((detailsElement, index) => (
                  <TableCell
                    style={{
                      // width: 80,
                      height: 60,
                      textAlign: "center",
                      verticalAlign: "middle",
                      border: "0.5px solid #000"
                    }}
                    className={`inline-cell ${policy?.getUnitColor(
                      detailsElement,
                      completedPercent.completedValue
                    )}`}
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
                      defaultOption={policy?.defaultType}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PublicTerritoryTable;
