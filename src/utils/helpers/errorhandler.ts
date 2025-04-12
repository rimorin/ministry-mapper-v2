import * as Sentry from "@sentry/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandler = (error: any, showAlert = true) => {
  // If it's an aborted request, we don't need to report it
  if (error.isAbort) {
    console.warn("Request was aborted:", error);
    return;
  }
  Sentry.captureException(error);
  // Show alert to user if requested
  if (showAlert) {
    const errorStatus = error.status || "Error";
    if (error.response && error.response.message) {
      alert(`${errorStatus}: ${error.response.message}`);
      return;
    }
    alert(error);
  }
};

export default errorHandler;
