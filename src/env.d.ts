/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_SYSTEM_ENVIRONMENT:
    | "local"
    | "development"
    | "staging"
    | "production";
  readonly VITE_POCKETBASE_URL: string;
  readonly VITE_LOCATIONIQ_API_KEY: string;
  readonly VITE_PRIVACY_URL: string;
  readonly VITE_TERMS_URL: string;
  readonly VITE_ABOUT_URL: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_UMAMI_WEBSITE_ID: string;
  readonly VITE_UMAMI_SRC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
