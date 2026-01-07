import { useState } from "react";
import {
  requestPasswordReset,
  confirmPasswordReset,
  confirmVerification
} from "../utils/pocketbase";
import useNotification from "./useNotification";

export default function usePasswordReset() {
  const { notifyError, notifyWarning } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleForgotPassword = async (email: string) => {
    try {
      setIsProcessing(true);
      await requestPasswordReset(email);
      notifyWarning(`Password reset email sent to ${email}.`);
    } catch (error) {
      notifyError(error);
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
      setMessage("Your password has been successfully reset.");
      setIsSuccess(true);
    } catch (error) {
      setMessage(JSON.stringify(error));
      setIsSuccess(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyEmail = async (actionCode: string) => {
    try {
      setIsProcessing(true);
      await confirmVerification(actionCode);
      setMessage("Your email address has been verified.");
      setIsSuccess(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : JSON.stringify(error)
      );
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
