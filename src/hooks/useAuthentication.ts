import { useState } from "react";
import {
  authenticateEmailAndPassword,
  authenticateOTP,
  authenticateOAuth2,
  requestOTP
} from "../utils/pocketbase";
import useNotification from "./useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "./useAnalytics";

export default function useAuthentication() {
  const { notifyError, notifyInfo, runAction } = useNotification();
  const { trackEvent } = useAnalytics();
  const [isLogin, setIsLogin] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");

  const processEmail = (email: string) => email.trim().toLowerCase();

  const handleOtpRequest = async (email: string) => {
    await runAction(async () => {
      setOtpSessionId(await requestOTP(email));
    });
  };

  const loginInWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    const processedEmail = processEmail(email);
    try {
      setIsLogin(true);
      await authenticateEmailAndPassword(processedEmail, password);
      trackEvent(ANALYTICS_EVENTS.LOGIN);
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
    await runAction(
      async () => {
        await authenticateOTP(otpSessionId, otpCode, mfaId);
        trackEvent(ANALYTICS_EVENTS.OTP_VERIFIED);
      },
      { setLoading: setIsLogin }
    );
  };

  const handleResendOtp = async (email: string) => {
    await handleOtpRequest(processEmail(email));
    notifyInfo("OTP sent to your email");
  };

  const handleOAuthSignIn = (provider: string) => {
    runAction(
      async () => {
        await authenticateOAuth2(provider);
        trackEvent(ANALYTICS_EVENTS.LOGIN_OAUTH, { provider });
      },
      { setLoading: setIsOAuthLoading }
    );
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
