import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";

import { completeOAuth2Flow } from "../utils/pocketbase";
import { mapPbAuthError } from "../utils/helpers/pbErrors";
import useNotification from "../hooks/useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "../hooks/useAnalytics";

/**
 * Landing route for the OAuth2 provider redirect. Exchanges the code for a
 * session, then hands back to the front page.
 */
const OAuthCallback = () => {
  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const { trackEvent } = useAnalytics();
  const [, navigate] = useLocation();
  // The code is single-use, so guard against StrictMode's double effect.
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) return;
    hasExchanged.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const exchange = async () => {
      try {
        if (!code || !state) {
          throw new Error(
            params.get("error") ??
              t(
                "auth.oauthFailed",
                "Google sign-in could not be completed. Please try again."
              )
          );
        }
        trackEvent(ANALYTICS_EVENTS.LOGIN_OAUTH, {
          provider: await completeOAuth2Flow(code, state)
        });
      } catch (err: unknown) {
        notifyError(mapPbAuthError(err, t) ?? err);
      } finally {
        navigate("/", { replace: true });
      }
    };
    exchange();
  }, [navigate, notifyError, t, trackEvent]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Spinner aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {t("auth.signingIn", "Signing in...")}
      </p>
    </div>
  );
};

export default OAuthCallback;
