import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { callFunction, getUser, isAbortError } from "../utils/pocketbase";
import { PB_FIELDS } from "../utils/constants";
import { resolveLocalized } from "../utils/resolveLocalized";
import useNotification from "./useNotification";
import useOnTabFocus from "./useOnTabFocus";
import useRealtimeSubscription from "./useRealtime";

export interface MyLink {
  id: string;
  type: string;
  expiry_date: string;
  assigner: string;
  map_description: string | Record<string, string>;
  territory: string;
  congregation_name: string;
  // The other accounts on the same link, by name.
  partners: string[];
  // The account made this link and put itself on it.
  own?: boolean;
}

/**
 * The unexpired links given to the signed-in account, across every
 * congregation. Follows them live and refetches when the tab comes back into
 * view: links are handed out and expire while the app sits in the background.
 * Every load announces the links it finds new (made for the account, or an
 * existing one it was added to). The map page mounts it too, only for the
 * announcement, so a second map is not missed while working the first.
 */
export default function useMyLinks() {
  const [links, setLinks] = useState<MyLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);

  const { t, i18n } = useTranslation();
  const { notifyInfo } = useNotification();
  const [, navigate] = useLocation();
  const userId = (getUser("id") as string) ?? "";

  // The links already shown, so a later load can tell which ones are new. Null
  // until the first load: everything in that one was given earlier.
  const knownIds = useRef<Set<string> | null>(null);

  const load = async () => {
    // The map page mounts this for everyone, and a link opened without an
    // account has no links of its own to ask for.
    if (!getUser("id")) return;
    try {
      const response = (await callFunction("/assignments/mine", {
        method: "POST",
        requestKey: "my-links"
      })) as { assignments?: MyLink[] };
      const latest = response.assignments ?? [];
      const known = knownIds.current;
      knownIds.current = new Set(latest.map((link) => link.id));
      setLinks(latest);
      setHasFailed(false);
      setIsLoading(false);
      if (!known) return;
      // Announced by the load, not by the event that started it: a load that
      // a newer one replaced never finishes, and its link must not go unsaid.
      for (const given of latest) {
        if (known.has(given.id) || given.own) continue;
        notifyInfo(
          t("myLinks.given", "You were given a map"),
          resolveLocalized(given.map_description, i18n.language),
          {
            label: t("myLinks.open", "Open"),
            onClick: () => navigate(`/map/${given.id}`)
          }
        );
      }
    } catch (error) {
      // A newer refresh replaced this one and will settle the state itself.
      if (isAbortError(error)) return;
      setHasFailed(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentionally run on mount only
  }, []);

  useOnTabFocus(() => void load());

  // The backend sends an account only the links it made or was given; the
  // list route then says which of those are its own to work. The filter needs
  // "user=" to pass the list rule, and ~ because ?= on the relation never
  // passes the backend's realtime access check.
  useRealtimeSubscription(
    "assignments",
    () => void load(),
    {
      filter: `user="${userId}" || assignees ~ "${userId}"`,
      fields: PB_FIELDS.ASSIGNMENT_HOLDERS
    },
    [userId],
    !!userId
  );

  // Being taken off a link is the one change that subscription cannot carry:
  // the link no longer names the account. The backend says so on "my-maps",
  // which is its signal to this account's sessions, not a collection.
  useRealtimeSubscription(
    "my-maps",
    () => void load(),
    undefined,
    [userId],
    !!userId
  );

  return { links, isLoading, hasFailed, refresh: load };
}
