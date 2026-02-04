import { FC } from "react";
import { FallbackProps } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Container, Button, Alert } from "react-bootstrap";
import "../../css/errorboundary.css";

interface ErrorBoundaryFallbackProps extends FallbackProps {
  componentName?: string;
}

const ErrorBoundaryFallback: FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = "component"
}) => {
  const { t } = useTranslation();

  return (
    <Container className="error-boundary-container">
      <Alert variant="danger" className="error-boundary-alert">
        <Alert.Heading>
          {t("error.boundary.title", "Something went wrong")}
        </Alert.Heading>
        <p className="mb-3">
          {t(
            "error.boundary.description",
            "We encountered an error while loading this section. Please try again."
          )}
        </p>
        {import.meta.env.MODE === "development" && (
          <details className="error-boundary-details">
            <summary className="error-boundary-summary">
              {t("error.boundary.details", "Error Details")} (Development Only)
            </summary>
            <div className="error-boundary-debug">
              <strong>Component:</strong> {componentName}
              <br />
              <strong>Error:</strong>{" "}
              {error instanceof Error ? error.message : String(error)}
              {error instanceof Error && error.stack && (
                <>
                  <br />
                  <strong>Stack Trace:</strong>
                  <pre className="error-boundary-stack">{error.stack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </Alert>
      <div className="error-boundary-actions">
        <Button variant="primary" size="sm" onClick={resetErrorBoundary}>
          {t("error.boundary.retry", "Try Again")}
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => (window.location.href = "/")}
        >
          {t("error.boundary.home", "Go to Home")}
        </Button>
      </div>
    </Container>
  );
};

export default ErrorBoundaryFallback;
