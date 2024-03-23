import { memo } from "react";
import StaticPage from "./staticPage";
import { Typography } from "@mui/material";
// import { Typography } from "@mui/joy";

const MaintenanceMode = memo(() => (
  // <Container className="container-main">
  //   <Card className="card-main">
  //     <Card.Img
  //       alt="Ministry Mapper logo"
  //       className="mm-logo"
  //       src={`/android-chrome-192x192.png`}
  //     />
  //     <Card.Body>
  //       <Card.Title className="text-center">
  //         Ministry Mapper is currently down for maintenance. 🚧
  //       </Card.Title>
  //       <Card.Text className="text-justify">
  //         We expect to be back online in a shortwhile. Thank you for your
  //         patience.
  //       </Card.Text>
  //     </Card.Body>
  //   </Card>
  // </Container>
  <StaticPage>
    <Typography variant="subtitle1">
      Ministry Mapper is currently down for maintenance. 🚧
    </Typography>
    <Typography variant="body1">
      We expect to be back online in a shortwhile. Thank you for your patience.
    </Typography>
  </StaticPage>
));

export default MaintenanceMode;
