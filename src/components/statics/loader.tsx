import { Container, Spinner } from "react-bootstrap";

const Loader = ({ variant = "primary" }: { variant?: string }) => (
  <Container
    className="d-flex align-items-center justify-content-center vh-100"
    fluid
  >
    <Spinner animation="border" variant={variant} role="status" />
  </Container>
);

export default Loader;
