import { memo } from "react";
import StaticPage from "./staticPage";
import { Typography } from "@mui/material";
// import { Typography } from "@mui/joy";

const InvalidPage = memo(() => (
  // <Container className="container-main">
  //   <Fade appear={true} in={true}>
  //     <Card className="card-main">
  //       <Card.Img
  //         alt="Ministry Mapper logo"
  //         className="mm-logo"
  //         src="/android-chrome-192x192.png"
  //       />
  //       <Card.Body>
  //         <Card.Title className="text-center">
  //           This link has expired ⌛
  //         </Card.Title>
  //       </Card.Body>
  //     </Card>
  //   </Fade>
  // </Container>
  <StaticPage>
    <Typography variant="subtitle1">This link has expired ⌛</Typography>
  </StaticPage>
));

export default InvalidPage;
