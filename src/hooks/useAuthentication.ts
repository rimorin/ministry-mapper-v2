import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  authenticateEmailAndPassword,
  authenticateOTP,
  startOAuth2Flow,
  requestOTP
} from "../utils/pocketbase";
import useNotification from "./useNotification";
import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import { mapPbAuthError } from "../utils/helpers/pbErrors";

const OAUTH_RELEASE_MS = 4_000;

export default function useAuthentication() {
  const { t } = useTranslation();
  const { notifyError, notifyInfo, runAction } = useNotification();
  const [isLogin, setIsLogin] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [oauthProvider, setOAuthProvider] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaId, setMfaId] = useState("");

  const processEmail = (email: string) => email.trim().toLowerCase();

  const notifyAuthError = (err: unknown) =>
    notifyError(mapPbAuthError(err, t) ?? err);

  const handleOtpRequest = async (email: string) => {
    await runAction(
      async () => {
        setOtpSessionId(await requestOTP(email));
      },
      { onError: notifyAuthError }
    );
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
    } catch (err: unknown) {
      const mfaId = (err as { response?: { mfaId?: string } })?.response?.mfaId;
      if (!mfaId) {
        notifyAuthError(err);
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
      { setLoading: setIsLogin, onError: notifyAuthError }
    );
  };

  const handleResendOtp = async (email: string) => {
    await handleOtpRequest(processEmail(email));
    notifyInfo(t("auth.codeSent", "A new code is on its way."));
  };

  const handleOAuthSignIn = (provider: string) => {
    setOAuthProvider(provider);
    setIsOAuthLoading(true);
    runAction(() => startOAuth2Flow(provider), {
      onError: (err) => {
        setIsOAuthLoading(false);
        notifyError(err);
      }
    });
  };

  // Covers the wait for the provider's page. Closing Apple's sheet returns
  // here without a reload or any event, and Back restores the page as it was.
  useEffect(() => {
    if (!isOAuthLoading) return;
    const release = () => setIsOAuthLoading(false);
    const timer = setTimeout(release, OAUTH_RELEASE_MS);
    window.addEventListener("pageshow", release);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pageshow", release);
    };
  }, [isOAuthLoading]);

  const clearOtpState = () => {
    setOtpSessionId("");
    setOtpCode("");
    setMfaId("");
  };

  return {
    isLogin,
    isOAuthLoading,
    oauthProvider,
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
