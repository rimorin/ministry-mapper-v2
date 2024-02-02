// import { Row, Col, Card } from "react-bootstrap";
import {
  Box,
  Card,
  CardContent,
  CardOverflow,
  Divider,
  Grid,
  Sheet,
  Typography
} from "@mui/joy";
import { territoryLandedProps } from "../../utils/interface";
import UnitStatus from "./unit";

const PrivateTerritoryTable = ({
  isAdmin,
  houses,
  completedPercent,
  policy: hhpolicy,
  handleHouseUpdate
}: territoryLandedProps) => (
  <Sheet
    sx={
      // add padding and center
      {
        padding: "0.5rem",
        display: "flex",
        justifyContent: "center"
      }
    }
  >
    <Grid container spacing={1}>
      {houses &&
        houses.units.map((element, index) => (
          <Grid key={`house-column-${index}`}>
            <Card
              sx={{
                width: 100,
                height: 90,
                padding: 0.2
              }}
            >
              <CardContent
                style={{
                  // vertical components
                  display: "flex",
                  flexDirection: "column",
                  // // center
                  justifyContent: "space-evenly",
                  alignItems: "center"
                }}
                onClick={handleHouseUpdate}
                data-addressid={element.addressId}
                data-unitno={element.number}
                data-floor={houses.floor}
                data-hhtype={element.type}
                data-hhnote={element.note}
                data-hhstatus={element.status}
                data-nhcount={element.nhcount}
                data-dnctime={element.dnctime}
                data-sequence={element.sequence}
                data-postal={element.propertyPostal}
              >
                {/* <Card.Header
                style={{ padding: "0.10rem" }}
                className="fluid-bolding fluid-text"
              >
                {element.number}
              </Card.Header> */}
                <Box>
                  <Typography level="title-lg">{element.number}</Typography>
                  <Divider
                    sx={{
                      width: "100%",
                      height: "1px",
                      backgroundColor: "red"
                    }}
                  />
                </Box>
                {/* <div
                className={`landed-unit fluid-bolding fluid-text ${hhpolicy?.getUnitColor(
                  element,
                  completedPercent.completedValue
                )}`}
                style={{ padding: "0.3rem 0" }}
              > */}
                <Box>
                  <UnitStatus
                    type={element.type}
                    note={element.note}
                    status={element.status}
                    nhcount={element.nhcount}
                    defaultOption={hhpolicy?.defaultType}
                  />
                </Box>
                {/* </div> */}
              </CardContent>
            </Card>
          </Grid>
        ))}
    </Grid>
  </Sheet>
);

export default PrivateTerritoryTable;
