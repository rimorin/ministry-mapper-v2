import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";

import { completeOAuth2Flow } from "../utils/pocketbase";
import { mapPbAuthError } from "../utils/helpers/pbErrors";
import useNotification from "../hooks/useNotification";
import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";

// What a provider reports when the person closed its screen: Google's code,
// then Apple's.
const DISMISSED = new Set(["access_denied", "user_cancelled_authorize"]);

/**
 * Landing route for the OAuth2 provider redirect. Exchanges the code for a
 * session, then hands back to the front page.
 */
const OAuthCallback = () => {
  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const [, navigate] = useLocation();
  // The code is single-use, so guard against StrictMode's double effect.
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) return;
    hasExchanged.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const providerError = params.get("error");
    const name = params.get("name") ?? undefined;
    const exchange = async () => {
      try {
        // Dismissing the provider's screen is a choice, not a failure. Anything
        // else it reports is shown translated — the raw code means nothing here.
        if (providerError) {
          if (!DISMISSED.has(providerError)) {
            notifyError(
              t(
                "auth.oauthFailed",
                "Sign-in could not be completed. Please try again."
              )
            );
          }
          return;
        }
        if (!code || !state) return;
        const provider = await completeOAuth2Flow(code, state, name);
        if (provider) trackEvent(ANALYTICS_EVENTS.LOGIN_OAUTH, { provider });
      } catch (err: unknown) {
        notifyError(mapPbAuthError(err, t) ?? err);
      } finally {
        navigate("/", { replace: true });
      }
    };
    exchange();
  }, [navigate, notifyError, t]);

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
