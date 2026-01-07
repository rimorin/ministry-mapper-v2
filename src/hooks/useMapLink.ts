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
    readPinnedMessages: string
  ): Promise<addressDetails | undefined> => {
    const linkRecord = await getDataById("assignments", id, {
      requestKey: null,
      expand: "map, map.congregation",
      fields: PB_FIELDS.ASSIGNMENT_LINKS
    });
    if (!linkRecord) {
      setIsLinkExpired(true);
      return;
    }
    const congId = linkRecord.expand?.map.expand?.congregation.id;
    const congOptions = await getList("options", {
      filter: `congregation="${congId}"`,
      requestKey: null,
      fields: PB_FIELDS.CONGREGATION_OPTIONS,
      sort: "sequence"
    });
    const expiryTimestamp = new Date(linkRecord.expiry_date).getTime();
    setTokenEndTime(expiryTimestamp);
    const currentTimestamp = new Date().getTime();
    const isLinkExpired = currentTimestamp > expiryTimestamp;
    setIsLinkExpired(isLinkExpired);
    if (isLinkExpired) {
      return;
    }
    setCoordinates(
      linkRecord.expand?.map.coordinates || DEFAULT_COORDINATES.Singapore
    );
    setPolicy(
      new Policy(
        linkRecord.publisher,
        congOptions.map((option: RecordModel) => {
          return {
            id: option.id,
            code: option.code,
            description: option.description,
            isCountable: option.is_countable,
            isDefault: option.is_default,
            sequence: option.sequence
          };
        }),
        linkRecord.expand?.map.expand?.congregation.max_tries,
        linkRecord.expand?.map.expand?.congregation.origin,
        USER_ACCESS_LEVELS.PUBLISHER.CODE,
        linkRecord.expand?.map.expand?.congregation.expiry_hours,
        congId
      )
    );

    const details = {
      id: linkRecord.map,
      type: linkRecord.expand?.map.type || TERRITORY_TYPES.MULTIPLE_STORIES,
      location: linkRecord.expand?.map.location || "",
      aggregates: {
        display: linkRecord.expand?.map.progress + "%",
        value: linkRecord.expand?.map.progress
      },
      name: linkRecord.expand?.map.description,
      coordinates: linkRecord.expand?.map.coordinates
    } as addressDetails;

    if (localStorage.getItem(`${id}-readPinnedMessages`) === null) {
      checkPinnedMessages(linkRecord.map, readPinnedMessages);
    }
    setMapDetails(details);
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
    hasPinnedMessages,
    setHasPinnedMessages,
    getMapData,
    checkPinnedMessages
  };
}
