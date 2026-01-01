import { useErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";

interface ErrorHandlerOptions {
  context?: string;
  silent?: boolean;
}

const useErrorHandler = () => {
  const { showBoundary } = useErrorBoundary();

  const handleError = (
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const { context = "async operation", silent = false } = options;
    const errorObj = error instanceof Error ? error : new Error(String(error));

    if (import.meta.env.MODE === "development") {
      console.error(`Error in ${context}:`, errorObj);
    }

    if (import.meta.env.VITE_SYSTEM_ENVIRONMENT === "production") {
      Sentry.captureException(errorObj, {
        contexts: { operation: { name: context } }
      });
    }

    if (!silent) {
      showBoundary(errorObj);
    }
  };

  return { handleError };
};

export default useErrorHandler;
