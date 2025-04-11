import * as Sentry from "@sentry/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandler = (error: any, showAlert = true) => {
  Sentry.captureException(error);
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
