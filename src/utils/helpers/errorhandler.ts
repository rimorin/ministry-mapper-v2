import * as Sentry from "@sentry/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractValidationErrors = (data: any): string => {
  return Object.entries(data)
    .filter(
      ([, value]) =>
        value &&
        typeof value === "object" &&
        "message" in value &&
        value.message
    )
    .map(
      ([field, value]) => `${field}: ${(value as { message: string }).message}`
    )
    .join("\n");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatErrorMessage = (error: any): string => {
  const status = error.status || "Error";
  const data = error.response?.data;
  const message = error.response?.message;

  if (data && typeof data === "object") {
    const validationErrors = extractValidationErrors(data);
    if (validationErrors) {
      return `${status}: ${message || "Validation failed"}\n\n${validationErrors}`;
    }
  }
  return message ? `${status}: ${message}` : String(error);
};

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
    alert(formatErrorMessage(error));
  }
};

export default errorHandler;
