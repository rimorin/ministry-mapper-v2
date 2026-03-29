declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string,
        eventData?: Record<string, string | number | boolean>
      ) => void;
      identify: (
        sessionData: Record<string, string | number | boolean>
      ) => void;
    };
  }
}

const ANALYTICS_EVENTS = {
  // Auth
  SIGNUP: "signup",
  LOGIN: "login",
  LOGIN_OAUTH: "login-oauth",
  OTP_VERIFIED: "otp-verified",

  // Congregation
  REPORT_GENERATED: "report-generated",

  // Messages
  MESSAGES_OPENED: "messages-opened",
  MESSAGE_SENT: "message-sent",
  MESSAGE_DELETED: "message-deleted",
  MESSAGE_PINNED: "message-pinned",

  // UI Preferences
  THEME_CHANGED: "theme-changed",
  LANGUAGE_CHANGED: "language-changed",

  // Quick Link
  QUICK_LINK_GENERATED: "quick-link-generated",
  QUICK_LINK_SHARED: "quick-link-shared",

  // Map / List View Toggle
  MAP_VIEW_TOGGLED: "map-view-toggled",
  ADDRESS_VIEW_TOGGLED: "address-view-toggled",
  TERRITORY_LIST_VIEW_TOGGLED: "territory-list-view-toggled",

  // Map Coordinates
  TERRITORY_BOUNDARY_DRAW_STARTED: "territory-boundary-draw-started",
  TERRITORY_BOUNDARY_DRAW_COMPLETED: "territory-boundary-draw-completed",
  TERRITORY_BOUNDARY_SAVED: "territory-boundary-saved",
  ADDRESS_GEOLOCATION_UPDATED: "address-geolocation-updated",

  // Directions
  TRAVEL_MODE_CHANGED: "travel-mode-changed",
  DIRECTIONS_OPENED: "directions-opened",
  ADDRESS_DIRECTIONS_OPENED: "address-directions-opened"
} as const;

function initAnalytics(): void {
  const siteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  const srcUrl = import.meta.env.VITE_UMAMI_SRC_URL;

  if (!siteId || !srcUrl) return;
  if (document.querySelector(`script[data-website-id="${siteId}"]`)) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = srcUrl;
  script.dataset.websiteId = siteId;
  script.dataset.performance = "true";

  const domains = import.meta.env.VITE_UMAMI_DOMAINS;
  if (domains) script.dataset.domains = domains;

  document.head.appendChild(script);
}

export { ANALYTICS_EVENTS, initAnalytics };
