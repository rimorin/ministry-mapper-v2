import { TERRITORY_TYPES } from "../../utils/constants";
import { territoryTableProps } from "../../utils/interface";
import PrivateTerritoryTable from "./privatetable";
import PublicTerritoryTable from "./publictable";

const AdminTable = ({
  postalCode,
  floors,
  maxUnitNumberLength,
  completedPercent,
  policy,
  handleUnitNoUpdate,
  handleUnitStatusUpdate,
  handleFloorDelete,
  userAccessLevel,
  territoryType
}: territoryTableProps) => {
  if (territoryType === TERRITORY_TYPES.PRIVATE) {
    return (
      <PrivateTerritoryTable
        isAdmin={true}
        postalCode={postalCode}
        houses={floors[0]}
        completedPercent={completedPercent}
        handleHouseUpdate={handleUnitStatusUpdate}
        policy={policy}
      />
    );
  }

  return (
    <PublicTerritoryTable
      postalCode={postalCode}
      floors={floors}
      maxUnitNumberLength={maxUnitNumberLength}
      completedPercent={completedPercent}
      policy={policy}
      userAccessLevel={userAccessLevel}
      handleFloorDelete={handleFloorDelete}
      handleUnitNoUpdate={handleUnitNoUpdate}
      handleUnitStatusUpdate={handleUnitStatusUpdate}
    />
  );
  // return (
  //   <Table stickyHeader hoverRow stripe="odd" borderAxis="both">
  //     <thead>
  //       <tr>
  //         <th
  //           style={{
  //             width: 100,
  //             height: 50,
  //             textAlign: "center",
  //             verticalAlign: "middle",
  //             // position: "sticky",
  //             left: 0,
  //             zIndex: 101
  //           }}
  //           scope="col"
  //           // className="text-center align-middle sticky-left-cell"
  //         >
  //           lvl/unit
  //         </th>
  //         {floors.length > 0 &&
  //           floors[0].units.map((item, index) => {
  //             return (
  //               <th
  //                 style={{
  //                   width: 80,
  //                   height: 50,
  //                   textAlign: "center",
  //                   verticalAlign: "middle"
  //                 }}
  //                 key={`${index}-${item.number}`}
  //                 scope="col"
  //                 onClick={handleUnitNoUpdate}
  //                 data-length={floors[0].units.length}
  //                 data-sequence={item.sequence}
  //                 data-unitno={item.number}
  //               >
  //                 {ZeroPad(item.number, maxUnitNumberLength)}
  //               </th>
  //             );
  //           })}
  //       </tr>
  //     </thead>
  //     <tbody key={`tbody-${postalCode}`}>
  //       {floors &&
  //         floors.map((floorElement, floorIndex) => (
  //           <tr key={`row-${floorIndex}`}>
  //             <th
  //               key={`floor-${floorIndex}`}
  //               style={{
  //                 width: 100,
  //                 height: 60,
  //                 position: "sticky",
  //                 left: 0,
  //                 zIndex: 100
  //               }}
  //             >
  //               <Box
  //                 sx={{
  //                   display: "flex",
  //                   alignItems: "center",
  //                   justifyContent: "center"
  //                 }}
  //               >
  //                 <ComponentAuthorizer
  //                   requiredPermission={
  //                     USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE
  //                   }
  //                   userPermission={userAccessLevel}
  //                 >
  //                   <IconButton
  //                     onClick={handleFloorDelete}
  //                     data-floor={floorElement.floor}
  //                   >
  //                     <DeleteIcon />
  //                   </IconButton>
  //                 </ComponentAuthorizer>
  //                 <Typography level="body-sm">{`${ZeroPad(
  //                   floorElement.floor.toString(),
  //                   DEFAULT_FLOOR_PADDING
  //                 )}`}</Typography>
  //               </Box>
  //             </th>
  //             {floorElement.units.map((detailsElement, index) => (
  //               <td
  //                 style={{
  //                   width: 80,
  //                   height: 60,
  //                   textAlign: "center",
  //                   verticalAlign: "middle"
  //                 }}
  //                 // className={`inline-cell ${policy?.getUnitColor(
  //                 //   detailsElement,
  //                 //   completedPercent.completedValue
  //                 // )}`}
  //                 onClick={handleUnitStatusUpdate}
  //                 key={`${index}-${detailsElement.number}`}
  //                 data-floor={floorElement.floor}
  //                 data-unitno={detailsElement.number}
  //                 data-hhtype={detailsElement.type}
  //                 data-hhnote={detailsElement.note}
  //                 data-hhstatus={detailsElement.status}
  //                 data-nhcount={detailsElement.nhcount}
  //                 data-addressid={detailsElement.addressId}
  //                 data-postal={detailsElement.propertyPostal}
  //                 data-dnctime={
  //                   detailsElement.dnctime || DEFAULT_UNIT_DNC_MS_TIME
  //                 }
  //               >
  //                 <UnitStatus
  //                   key={`unit-${index}-${detailsElement.number}`}
  //                   type={detailsElement.type}
  //                   note={detailsElement.note}
  //                   status={detailsElement.status}
  //                   nhcount={detailsElement.nhcount}
  //                   defaultOption={policy?.defaultType}
  //                 />
  //               </td>
  //             ))}
  //           </tr>
  //         ))}
  //     </tbody>
  //   </Table>
  // );
};

export default AdminTable;
