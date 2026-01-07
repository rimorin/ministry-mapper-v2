import { useState } from "react";
import {
  authenticateEmailAndPassword,
  authenticateOTP,
  authenticateOAuth2,
  requestOTP
} from "../utils/pocketbase";
import useNotification from "./useNotification";

export default function useAuthentication() {
  const { notifyError, notifyInfo } = useNotification();
  const [isLogin, setIsLogin] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");

  const processEmail = (email: string) => email.trim().toLowerCase();

  const handleOtpRequest = async (email: string) => {
    try {
      setOtpSessionId(await requestOTP(email));
    } catch (err) {
      notifyError(err);
    }
  };

  const loginInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    const processedEmail = processEmail(email);
    try {
      setIsLogin(true);
      await authenticateEmailAndPassword(processedEmail, password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const mfaId = err.response?.mfaId;
      if (!mfaId) {
        notifyError(err);
        return;
      }
      await handleOtpRequest(processedEmail);
      setMfaId(mfaId);
    } finally {
      setIsLogin(false);
    }
  };

  const handleOtpSubmit = async (otpSessionId: string, otpCode: string) => {
    try {
      setIsLogin(true);
      await authenticateOTP(otpSessionId, otpCode, mfaId);
    } catch (err) {
      notifyError(err);
    } finally {
      setIsLogin(false);
    }
  };

  const handleResendOtp = async (email: string) => {
    await handleOtpRequest(processEmail(email));
    notifyInfo("OTP sent to your email");
  };

  const handleOAuthSignIn = (provider: string) => {
    setIsOAuthLoading(true);
    authenticateOAuth2(provider)
      .catch((err) => {
        notifyError(err);
      })
      .finally(() => {
        setIsOAuthLoading(false);
      });
  };

  const clearOtpState = () => {
    setOtpSessionId("");
    setOtpCode("");
    setMfaId("");
  };

  return {
    isLogin,
    isOAuthLoading,
    otpSessionId,
    otpCode,
    setOtpCode,
    mfaId,
    loginInWithEmailAndPassword,
    handleOtpSubmit,
    handleResendOtp,
    handleOAuthSignIn,
    clearOtpState
  };
}
