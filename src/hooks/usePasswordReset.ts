import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  requestPasswordReset,
  confirmPasswordReset,
  confirmVerification
} from "../utils/pocketbase";
import useNotification, { formatErrorMessage } from "./useNotification";
import { mapPbAuthError } from "../utils/helpers/pbErrors";

export default function usePasswordReset() {
  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleForgotPassword = async (email: string) => {
    try {
      setIsProcessing(true);
      await requestPasswordReset(email);
      return true;
    } catch (error) {
      notifyError(mapPbAuthError(error, t) ?? error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (
    actionCode: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      setIsResetting(true);
      await confirmPasswordReset(actionCode, newPassword, confirmPassword);
      setMessage(t("auth.passwordResetDone", "Your password has been reset"));
      setIsSuccess(true);
    } catch (error) {
      setMessage(mapPbAuthError(error, t) ?? formatErrorMessage(error));
      setIsSuccess(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyEmail = async (actionCode: string) => {
    try {
      setIsProcessing(true);
      await confirmVerification(actionCode);
      setMessage(t("auth.emailVerified", "Your email is verified"));
      setIsSuccess(true);
    } catch (error) {
      setMessage(mapPbAuthError(error, t) ?? formatErrorMessage(error));
      setIsSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    isResetting,
    message,
    isSuccess,
    handleForgotPassword,
    handleResetPassword,
    handleVerifyEmail
  };
}
