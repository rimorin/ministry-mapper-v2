import type { Breadcrumb, ErrorEvent } from "@sentry/react";

// A share link's id is the whole of a publisher's access. It sits in the map
// page's address and in the path of its own record.
const LINK_ID_IN_PATH = /(\/map\/|\/assignments\/records\/)[a-z0-9]{15}\b/g;

// A URL as it may go to Sentry: no query or fragment (filters and sign-in
// replies carry ids, names and codes) and no share link id.
export const scrubUrl = (url: string): string =>
  url.split(/[?#]/)[0].replace(LINK_ID_IN_PATH, "$1:id");

const URL_KEYS = ["url", "from", "to"];

export const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb => {
  const data = breadcrumb.data;
  if (data) {
    for (const key of URL_KEYS) {
      if (typeof data[key] === "string") data[key] = scrubUrl(data[key]);
    }
  }
  return breadcrumb;
};

export const scrubEvent = (event: ErrorEvent): ErrorEvent => {
  const request = event.request;
  if (request) {
    if (request.url) request.url = scrubUrl(request.url);
    delete request.query_string;
    const headers = request.headers;
    if (headers) {
      for (const name of Object.keys(headers)) {
        if (name.toLowerCase() === "referer") {
          headers[name] = scrubUrl(headers[name]);
        }
      }
    }
  }
  return event;
};
