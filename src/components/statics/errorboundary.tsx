import { FC } from "react";
import { FallbackProps } from "react-error-boundary";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import * as m from "motion/react-m";
import { fadeSlideUp, tapFeedback } from "@/lib/motion";

interface ErrorBoundaryFallbackProps extends FallbackProps {
  componentName?: string;
}

const ErrorBoundaryFallback: FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = "component"
}) => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <m.div
      className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center"
      variants={fadeSlideUp}
      initial="hidden"
      animate="show"
    >
      <div role="alert" className="w-full max-w-[600px]">
        <h4 className="mb-2 font-semibold">
          {t("error.boundary.title", "Something went wrong")}
        </h4>
        <p className="mb-3">
          {t(
            "error.boundary.description",
            "We encountered an error while loading this section. Please try again."
          )}
        </p>
        {import.meta.env.MODE === "development" && (
          <details className="mt-4 text-left text-sm">
            <summary className="cursor-pointer font-semibold">
              {t("error.boundary.details", "Error Details")} (Development Only)
            </summary>
            <div className="mt-2">
              <strong>Component:</strong> {componentName}
              <br />
              <strong>Error:</strong>{" "}
              {error instanceof Error ? error.message : String(error)}
              {error instanceof Error && error.stack && (
                <>
                  <br />
                  <strong>Stack Trace:</strong>
                  <pre className="mt-2 overflow-auto rounded-md bg-muted p-2 text-left text-xs text-foreground">
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <m.button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={resetErrorBoundary}
          whileTap={tapFeedback}
        >
          {t("error.boundary.retry", "Try Again")}
        </m.button>
        <m.button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => navigate("/")}
          whileTap={tapFeedback}
        >
          {t("error.boundary.home", "Go to Home")}
        </m.button>
      </div>
    </m.div>
  );
};

export default ErrorBoundaryFallback;
