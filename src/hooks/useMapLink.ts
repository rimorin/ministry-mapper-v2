import { useState } from "react";
import { getDataById, getList } from "../utils/pocketbase";
import { addressDetails, latlongInterface } from "../utils/interface";
import { Policy } from "../utils/policies";
import {
  TERRITORY_TYPES,
  DEFAULT_COORDINATES,
  MESSAGE_TYPES,
  USER_ACCESS_LEVELS,
  PB_FIELDS
} from "../utils/constants";
import { RecordModel } from "pocketbase";
import useNotification from "./useNotification";
import { sortBySequence } from "../utils/helpers/sorthelpers";
import { loadAssignmentCache, saveAssignmentCache } from "../utils/smartsync";

export default function useMapLink() {
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

  const checkPinnedMessages = async (
    map: string,
    readPinnedMessages: string
  ) => {
    if (!map) return;
    if (readPinnedMessages === "true") return;
    const pinnedMessages = await getList("messages", {
      filter: `map = "${map}" && type= "${MESSAGE_TYPES.ADMIN}" && pinned = true`,
      fields: "id",
      requestKey: null
    });
    setHasPinnedMessages(pinnedMessages.length > 0);
  };

  const retrieveLinkData = async (
    id: string,
    readPinnedMessages: string,
    preloadedRecord?: RecordModel
  ): Promise<addressDetails | undefined> => {
    const linkRecord =
      preloadedRecord ??
      (await getDataById("assignments", id, {
        requestKey: null,
        expand:
          "map, map.congregation, map.congregation.options_via_congregation",
        fields: PB_FIELDS.ASSIGNMENT_LINKS
      }));
    if (!linkRecord) {
      setIsLinkExpired(true);
      return;
    }
    const expiryTimestamp = new Date(linkRecord.expiry_date).getTime();
    setTokenEndTime(expiryTimestamp);
    const isLinkExpired = new Date().getTime() > expiryTimestamp;
    setIsLinkExpired(isLinkExpired);
    if (isLinkExpired) {
      return;
    }
    const mapExpand = linkRecord.expand?.map;
    const congregation = mapExpand?.expand?.congregation;
    const congId = congregation?.id;
    const congOptions = sortBySequence(
      (congregation?.expand?.options_via_congregation as
        | RecordModel[]
        | undefined) ?? []
    );

    setCoordinates(mapExpand?.coordinates || DEFAULT_COORDINATES.Singapore);
    setPolicy(
      new Policy(
        linkRecord.publisher,
        congOptions.map((option: RecordModel) => ({
          id: option.id,
          code: option.code,
          description: option.description,
          isCountable: option.is_countable,
          isDefault: option.is_default,
          sequence: option.sequence
        })),
        congregation?.max_tries,
        congregation?.origin,
        USER_ACCESS_LEVELS.PUBLISHER.CODE,
        congregation?.expiry_hours,
        congId
      )
    );

    const details = {
      id: linkRecord.map,
      type: mapExpand?.type || TERRITORY_TYPES.MULTIPLE_STORIES,
      location: mapExpand?.location || "",
      aggregates: {
        display: mapExpand?.progress + "%",
        value: mapExpand?.progress,
        notDone: mapExpand?.aggregates?.notDone ?? 0,
        notHome: mapExpand?.aggregates?.notHome ?? 0
      },
      name: mapExpand?.description,
      coordinates: mapExpand?.coordinates
    } as addressDetails;

    if (localStorage.getItem(`${id}-readPinnedMessages`) === null) {
      checkPinnedMessages(linkRecord.map, readPinnedMessages);
    }
    setMapDetails(details);
    setTerritoryId(mapExpand?.territory || "");
    if (!preloadedRecord) {
      saveAssignmentCache(id, linkRecord);
    }
    return details;
  };

  const getMapData = async (
    linkId: string | undefined,
    readPinnedMessages: string
  ) => {
    if (!linkId) return;
    try {
      const mapDetails = await retrieveLinkData(linkId, readPinnedMessages);
      if (!mapDetails) {
        return;
      }
      return mapDetails.id;
    } catch (error) {
      const cached = loadAssignmentCache<RecordModel>(linkId);
      if (cached) {
        const cachedDetails = await retrieveLinkData(
          linkId,
          readPinnedMessages,
          cached
        );
        if (cachedDetails) return cachedDetails.id;
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
    checkPinnedMessages
  };
}
