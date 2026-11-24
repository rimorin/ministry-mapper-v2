import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { oauth2ProviderOffered } from "../../utils/pocketbase";

// Apple's mark, drawn in the text colour so it follows the theme.
const AppleLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 315"
    width="16"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M213.8 167c.4 47.6 41.7 63.4 42.2 63.6-.3 1.2-6.6 22.6-21.8 44.8-13 19.1-26.7 38.2-48 38.6-21.1.4-28-12.5-52-12.5s-31.6 12.1-51.5 12.9c-20.7.8-36.4-20.7-49.6-39.8-27-39-47.7-110.3-20-158.4a77 77 0 0 1 65.1-39.4c20.3-.4 39.5 13.6 51.9 13.6s35.7-16.9 60.2-14.4c10.2.4 39 4.2 57.5 31.2-1.5 1-34.4 20-34 59.8M174.2 50.2A69 69 0 0 0 190.6 0c-15.8.6-35 10.5-46.3 23.8-10.2 11.8-19.1 30.6-16.7 48.7 17.6 1.3 35.7-9 46.6-22.3" />
  </svg>
);

interface OAuthButtonsProps {
  disabled: boolean;
  // The provider a sign-in is under way with, or "" when none is.
  pendingProvider: string;
  onSignIn: (provider: string) => void;
}

// The one-tap ways in, shared by the sign-in and sign-up pages: the same
// buttons make an account for someone new and open it for someone returning.
// Renders the buttons alone, for a Field to lay out.
const OAuthButtons = ({
  disabled,
  pendingProvider,
  onSignIn
}: OAuthButtonsProps) => {
  const { t } = useTranslation();

  // Apple is offered once the backend has it switched on.
  const [appleOffered, setAppleOffered] = useState(false);
  useEffect(() => {
    let current = true;
    void oauth2ProviderOffered("apple").then((offered) => {
      if (current) setAppleOffered(offered);
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <>
      <Button
        variant="outline"
        type="button"
        className="gap-2"
        disabled={disabled}
        onClick={() => onSignIn("google")}
      >
        {pendingProvider === "google" ? (
          <Spinner aria-hidden="true" />
        ) : (
          <img
            src={getAssetUrl("google.svg")}
            alt="Google logo"
            width="18"
            height="18"
          />
        )}
        {pendingProvider === "google"
          ? t("auth.signingIn", "Signing in...")
          : t("auth.signInWithGoogle", "Continue with Google")}
      </Button>
      {appleOffered && (
        <Button
          variant="outline"
          type="button"
          className="gap-2"
          disabled={disabled}
          onClick={() => onSignIn("apple")}
        >
          {pendingProvider === "apple" ? (
            <Spinner aria-hidden="true" />
          ) : (
            <AppleLogo />
          )}
          {pendingProvider === "apple"
            ? t("auth.signingIn", "Signing in...")
            : t("auth.signInWithApple", "Continue with Apple")}
        </Button>
      )}
    </>
  );
};

export default OAuthButtons;
