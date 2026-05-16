import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { isAbortError } from "../utils/pocketbase";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title?: string;
  silent?: boolean;
}

const extractValidationErrors = (data: Record<string, unknown>): string => {
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

export const formatErrorMessage = (error: unknown): string => {
  const e = error as {
    status?: number | string;
    response?: { data?: unknown; message?: string };
  };
  const status = e.status ?? "Error";
  const data = e.response?.data;
  const message = e.response?.message;

  if (data && typeof data === "object") {
    const validationErrors = extractValidationErrors(
      data as Record<string, unknown>
    );
    if (validationErrors) {
      return `${status}: ${message || "Validation failed"}\n\n${validationErrors}`;
    }
  }
  return message ? `${status}: ${message}` : String(error);
};

export const useNotification = () => {
  const handleNotification = (
    type: NotificationType,
    messageOrError: string | Error | unknown,
    options?: NotificationOptions
  ) => {
    const { title, silent = false } = options || {};

    if (type === "error") {
      if (isAbortError(messageOrError)) {
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

      toast.error(errorMessage, { id: "app-error", duration: Infinity });
    } else {
      const message =
        typeof messageOrError === "string"
          ? messageOrError
          : String(messageOrError);

      const opts = title ? { description: title } : undefined;

      switch (type) {
        case "success":
          toast.success(message, opts);
          break;
        case "warning":
          toast.warning(message, opts);
          break;
        case "info":
          toast.info(message, opts);
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

  const runAction = async <T>(
    fn: () => Promise<T>,
    options?: {
      setLoading?: (v: boolean) => void;
      onSuccess?: (result: T) => void;
      onError?: (error: unknown) => void;
    }
  ): Promise<void> => {
    options?.setLoading?.(true);
    try {
      const result = await fn();
      options?.onSuccess?.(result);
    } catch (error) {
      if (!isAbortError(error)) {
        if (options?.onError) {
          options.onError(error);
        } else {
          notifyError(error);
        }
      }
    } finally {
      options?.setLoading?.(false);
    }
  };

  return {
    handleNotification,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    runAction
  };
};

export default useNotification;
