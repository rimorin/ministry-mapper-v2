import { ANALYTICS_EVENTS } from "../utils/analytics";

export { ANALYTICS_EVENTS };

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
type EventData = Record<string, string | number | boolean>;

export default function useAnalytics() {
  const trackEvent = (event: EventName, data?: EventData) => {
    if (!window.umami) return;
    window.umami.track(event, data);
  };

  return { trackEvent };
}
