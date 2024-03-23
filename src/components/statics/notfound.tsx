import { Typography } from "@mui/material";
import StaticPage from "./staticPage";
// import { Typography } from "@mui/joy";

const NotFoundPage = () => (
  // <Container className="container-main">
  //   <Card className="card-main">
  //     <Card.Img
  //       alt="Ministry Mapper logo"
  //       className="mm-logo"
  //       src="/android-chrome-192x192.png"
  //     />
  //     <Card.Body>
  //       <Card.Title className="text-center">404 Page Not Found 🚫</Card.Title>
  //       <Card.Text className="text-justify">
  //         We are sorry, the page you requested could not be found.
  //       </Card.Text>
  //     </Card.Body>
  //   </Card>
  // </Container>
  <StaticPage>
    <Typography variant="subtitle1">404 Page Not Found 🚫</Typography>
    <Typography variant="body1">
      We are sorry, the page you requested could not be found.
    </Typography>
  </StaticPage>
);

export default NotFoundPage;
