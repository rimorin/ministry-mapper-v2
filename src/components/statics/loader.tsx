import { Container, Spinner } from "react-bootstrap";

interface LoaderProps {
  suspended?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ suspended = false }) => {
  if (suspended) {
    return (
      <div className="suspense-loader">
        <Spinner variant="primary" />
      </div>
    );
  }
  return (
    <Container
      className="d-flex align-items-center justify-content-center vh-100"
      fluid
    >
      <Spinner variant="primary" />
    </Container>
  );
};

export default Loader;
