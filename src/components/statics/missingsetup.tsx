import { memo } from "react";
import { Container, Card } from "react-bootstrap";

interface MissingSetupPageProps {
  message: string;
}

const MissingSetupPage: React.FC<MissingSetupPageProps> = memo(
  ({ message }) => (
    <Container className="container-main">
      <Card className="card-main">
        <Card.Img
          alt="Ministry Mapper logo"
          className="mm-logo"
          src="https://assets.ministry-mapper.com/android-chrome-192x192.png"
        />
        <Card.Body>
          <Card.Title className="text-center">{message}</Card.Title>
        </Card.Body>
      </Card>
    </Container>
  )
);

export default MissingSetupPage;
