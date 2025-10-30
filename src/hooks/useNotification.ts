import { useToast } from "../components/middlewares/toast";
import * as Sentry from "@sentry/react";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title?: string;
  silent?: boolean;
}

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

export const useNotification = () => {
  const toast = useToast();

  const handleNotification = (
    type: NotificationType,
    messageOrError: string | Error | unknown,
    options?: NotificationOptions
  ) => {
    const { title, silent = false } = options || {};

    if (type === "error") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((messageOrError as any)?.isAbort) {
        console.warn("Request was aborted:", messageOrError);
        return;
      }

      if (silent) {
        return;
      }

      if (messageOrError instanceof Error) {
        Sentry.captureException(messageOrError);
      }

      const errorMessage =
        typeof messageOrError === "string"
          ? messageOrError
          : formatErrorMessage(messageOrError);

      toast.error(errorMessage, "Error");
    } else {
      const message =
        typeof messageOrError === "string"
          ? messageOrError
          : String(messageOrError);

      switch (type) {
        case "success":
          toast.success(message, title);
          break;
        case "warning":
          toast.warning(message, title);
          break;
        case "info":
          toast.info(message, title);
          break;
      }
    }
  };

  const notifySuccess = (message: string, title?: string) =>
    handleNotification("success", message, { title });

  const notifyError = (
    messageOrError: string | Error | unknown,
    silent = false
  ) => handleNotification("error", messageOrError, { silent });

  const notifyWarning = (message: string, title?: string) =>
    handleNotification("warning", message, { title });

  const notifyInfo = (message: string, title?: string) =>
    handleNotification("info", message, { title });

  return {
    handleNotification,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo
  };
};

export default useNotification;
