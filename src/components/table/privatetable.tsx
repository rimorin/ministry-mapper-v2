// import {
//   Box,
//   Card,
//   CardContent,
//   Divider,
//   Grid,
//   Sheet,
//   Typography
// } from "@mui/joy";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid
} from "@mui/material";
import { territoryLandedProps } from "../../utils/interface";
import UnitStatus from "./unit";

const PrivateTerritoryTable = ({
  houses,
  policy: hhpolicy,
  completedPercent,
  handleHouseUpdate
}: territoryLandedProps) => (
  <Container
    sx={
      // add padding and center
      {
        maxHeight: 300,
        width: "100%",
        // padding: "0.5rem",
        // display: "flex",
        overflowY: "auto"
        // justifyContent: "center"
      }
    }
  >
    <Grid
      container
      // rowSpacing={5}
      // flexWrap="wrap"
      sx={{ width: "100%", justifyContent: "space-around", marginTop: 2 }}
    >
      {houses &&
        houses.units.map((element, index) => (
          // <Grid key={`house-column-${index}`}>
          <Card
            variant="outlined"
            key={`house-column-${index}`}
            sx={{
              width: 120,
              height: 90,
              marginY: 0.5
              // padding: 0.2
            }}
          >
            <CardHeader
              title={element.number}
              titleTypographyProps={{
                variant: "subtitle1",
                align: "center"
              }}
              sx={{
                padding: "0.1rem"
              }}
            />
            <Divider />
            <CardContent
              style={{
                // vertical components
                display: "flex",
                flexDirection: "column",
                // // center
                justifyContent: "space-evenly",
                alignItems: "center"
              }}
              className={`${hhpolicy?.getUnitColor(
                element,
                completedPercent.completedValue
              )}`}
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
              {/* <Box>
                <Typography variant="subtitle1">{element.number}</Typography>
                <Divider
                  sx={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "red"
                  }}
                />
              </Box> */}
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
          // </Grid>
        ))}
    </Grid>
  </Container>
);

export default PrivateTerritoryTable;
