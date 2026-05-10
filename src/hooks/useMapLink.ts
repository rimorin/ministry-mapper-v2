import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { callFunction, isUnauthorizedError } from "../utils/pocketbase";
import { resolveLocalized } from "../utils/resolveLocalized";
import {
  addressDetails,
  latlongInterface,
  LinkMapResponse,
  mapAddressResponse
} from "../utils/interface";
import { Policy } from "../utils/policies";
import {
  TERRITORY_TYPES,
  DEFAULT_COORDINATES,
  USER_ACCESS_LEVELS
} from "../utils/constants";
import useNotification from "./useNotification";
import {
  loadAssignmentCache,
  saveAssignmentCache,
  deleteAssignmentCache
} from "../utils/smartsync";

type CachedLinkMap = Omit<LinkMapResponse, "addresses">;

type GetMapDataResult = {
  mapId: string;
  preloadedAddresses: mapAddressResponse[];
};

export default function useMapLink() {
  const { i18n } = useTranslation();
  const { notifyError } = useNotification();
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [tokenEndTime, setTokenEndTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<latlongInterface>(
    DEFAULT_COORDINATES.Singapore
  );
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [mapDetails, setMapDetails] = useState<addressDetails>();
  const [territoryId, setTerritoryId] = useState("");
  const [hasPinnedMessages, setHasPinnedMessages] = useState(false);
  const linkIdRef = useRef<string | undefined>(undefined);

  const markLinkExpired = () => {
    if (linkIdRef.current) deleteAssignmentCache(linkIdRef.current);
    setIsLinkExpired(true);
  };

  useEffect(() => {
    window.addEventListener("mm-auth-expired", markLinkExpired);
    return () => window.removeEventListener("mm-auth-expired", markLinkExpired);
  }, []);

  const retrieveLinkData = async (
    id: string,
    preloadedRecord?: CachedLinkMap
  ): Promise<
    { details: addressDetails; addresses: mapAddressResponse[] } | undefined
  > => {
    const response: CachedLinkMap & { addresses?: mapAddressResponse[] } =
      preloadedRecord ??
      ((await callFunction("/link/map", {
        method: "POST",
        requestKey: null
      })) as LinkMapResponse);

    // Guard against stale cache written in a previous format
    if (!response?.map?.id) return undefined;

    const expiryTimestamp = new Date(response.expiry_date).getTime();
    setTokenEndTime(expiryTimestamp);
    const isExpired = new Date().getTime() > expiryTimestamp;
    setIsLinkExpired(isExpired);
    if (isExpired) return undefined;

    const { map: mapData, congregation } = response;

    setCoordinates(
      (mapData.coordinates as latlongInterface) || DEFAULT_COORDINATES.Singapore
    );
    setPolicy(
      new Policy(
        response.publisher,
        congregation.options.map((option) => ({
          id: option.id,
          code: option.code,
          description: option.description,
          isCountable: option.is_countable,
          isDefault: option.is_default,
          sequence: option.sequence
        })),
        congregation.max_tries,
        congregation.origin,
        USER_ACCESS_LEVELS.PUBLISHER.CODE,
        congregation.expiry_hours,
        congregation.id
      )
    );

    const details = {
      id: mapData.id,
      type: mapData.type || TERRITORY_TYPES.MULTIPLE_STORIES,
      aggregates: {
        display: mapData.progress + "%",
        value: mapData.progress,
        notDone: mapData.aggregates?.notDone ?? 0,
        notHome: mapData.aggregates?.notHome ?? 0
      },
      name: resolveLocalized(mapData.description, i18n.language),
      coordinates: mapData.coordinates
    } as addressDetails;

    setHasPinnedMessages(response.has_pinned_messages);
    setMapDetails(details);
    setTerritoryId(mapData.territory || "");

    if (!preloadedRecord) {
      const { addresses, ...toCache } = response as LinkMapResponse;
      saveAssignmentCache(id, toCache);
    }

    return { details, addresses: response.addresses ?? [] };
  };

  const getMapData = async (
    linkId: string | undefined
  ): Promise<GetMapDataResult | undefined> => {
    if (!linkId) return;
    linkIdRef.current = linkId;
    try {
      const result = await retrieveLinkData(linkId);
      if (!result) return;
      return { mapId: result.details.id, preloadedAddresses: result.addresses };
    } catch (error) {
      if (isUnauthorizedError(error)) {
        markLinkExpired();
        return;
      }
      const cached = loadAssignmentCache<CachedLinkMap>(linkId);
      if (cached) {
        const cachedResult = await retrieveLinkData(linkId, cached);
        if (cachedResult) {
          return { mapId: cachedResult.details.id, preloadedAddresses: [] };
        }
        return;
      }
      notifyError(error, true);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLinkExpired,
    tokenEndTime,
    isLoading,
    coordinates,
    policy,
    mapDetails,
    setMapDetails,
    territoryId,
    hasPinnedMessages,
    setHasPinnedMessages,
    getMapData,
    markLinkExpired
  };
}
