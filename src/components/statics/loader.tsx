import { Container, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface LoaderProps {
  suspended?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ suspended = false }) => {
  const { t } = useTranslation();

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
      <div className="text-center">
        <Spinner variant="primary" />
        <div className="mt-2">{t("common.loading")}</div>
      </div>
    </Container>
  );
};

export default Loader;
