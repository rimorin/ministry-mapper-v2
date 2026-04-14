import { useState, useRef } from "react";
import { TFunction } from "i18next";
import { RecordModel } from "pocketbase";
import { getList, getPaginatedList, getUser } from "../utils/pocketbase";
import {
  DEFAULT_CONGREGATION_MAX_TRIES,
  DEFAULT_SELF_DESTRUCT_HOURS,
  PB_FIELDS,
  DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION
} from "../utils/constants";
import { Policy } from "../utils/policies";
import { territoryDetails } from "../utils/interface";

interface UseAdminDataProps {
  userId: string;
  congregationCodeCache: string;
  congregationAccessRef: React.RefObject<Record<string, string>>;
  setUserCongregationAccesses: (
    accesses: Array<{ code: string; access: string; name: string }>
  ) => void;
  setCongregationCode: (code: string) => void;
  setCongregationCodeCache: (code: string) => void;
  setCongregationName: (name: string) => void;
  setDefaultExpiryHours: (hours: number) => void;
  setPolicy: (policy: Policy) => void;
  setTerritories: (territories: Map<string, territoryDetails>) => void;
  setSelectedTerritory: React.Dispatch<
    React.SetStateAction<{
      id: string;
      code: string | undefined;
      name: string | undefined;
    }>
  >;
  setTerritoryCodeCache: (code: string) => void;
  setUserAccessLevel: (level: string) => void;
  setIsUnauthorised: (unauthorised: boolean) => void;
  notifyError: (message: string, silent?: boolean) => void;
  notifyWarning: (message: string) => void;
  processCongregationTerritories: (
    territories: RecordModel[]
  ) => Map<string, territoryDetails>;
  territoryCodeCache: string;
  userEmail: string;
  t: TFunction<"translation", undefined>;
}

export default function useAdminData({
  userId,
  congregationCodeCache,
  congregationAccessRef,
  setUserCongregationAccesses,
  setCongregationCode,
  setCongregationCodeCache,
  setCongregationName,
  setDefaultExpiryHours,
  setPolicy,
  setTerritories,
  setSelectedTerritory,
  setTerritoryCodeCache,
  setUserAccessLevel,
  setIsUnauthorised,
  notifyError,
  notifyWarning,
  processCongregationTerritories,
  territoryCodeCache,
  userEmail,
  t
}: UseAdminDataProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAnyMaps, setHasAnyMaps] = useState<boolean>(false);
  const congregationDetailsRef = useRef<Record<string, RecordModel>>({});
  const fetchData = async () => {
    const userRoles = await getList("roles", {
      filter: `user="${userId}"`,
      expand: "congregation",
      fields: PB_FIELDS.ROLES,
      requestKey: `user-roles-${userId}`
    });
    if (userRoles.length === 0) {
      setIsLoading(false);
      setIsUnauthorised(true);
      notifyError(`Unauthorised access by ${userEmail}`, true);
      return;
    }
    const congregationAccesses = userRoles.map((record) => {
      return {
        code: record.expand?.congregation.id,
        access: record.role,
        name: record.expand?.congregation.name
      };
    });

    congregationAccessRef.current = congregationAccesses.reduce(
      (acc, { code, access }) => {
        acc[code] = access;
        return acc;
      },
      {} as Record<string, string>
    );
    congregationDetailsRef.current = userRoles.reduce(
      (acc, record) => {
        const cong = record.expand?.congregation;
        if (cong) acc[cong.id] = cong;
        return acc;
      },
      {} as Record<string, RecordModel>
    );
    setUserCongregationAccesses(congregationAccesses);
    const isCongregationCodeCacheValid = congregationAccesses.some(
      (access) => access.code === congregationCodeCache
    );

    const initialSelectedCode = isCongregationCodeCacheValid
      ? congregationCodeCache
      : congregationAccesses?.[0]?.code;

    if (!isCongregationCodeCacheValid) {
      setCongregationCodeCache("");
    }
    setCongregationCode(initialSelectedCode);
  };

  const fetchCongregationData = async (id: string) => {
    const [congOptions, territoryRecords] = await Promise.all([
      getList("options", {
        filter: `congregation="${id}"`,
        requestKey: `congregation-options-${id}`,
        fields: PB_FIELDS.CONGREGATION_OPTIONS,
        sort: "sequence"
      }),
      getList("territories", {
        filter: `congregation="${id}"`,
        requestKey: `territories-${id}`,
        sort: "code",
        fields: PB_FIELDS.TERRITORIES
      })
    ]);

    const congDetails = congregationDetailsRef.current[id];

    if (!congDetails) {
      notifyWarning(t("congregation.notFound", "Congregation not found."));
      return;
    }

    setCongregationName(congDetails.name);
    document.title = congDetails.name;
    setDefaultExpiryHours(
      congDetails.expiry_hours || DEFAULT_SELF_DESTRUCT_HOURS
    );
    setPolicy(
      new Policy(
        getUser("name") as string,
        congOptions?.map((option) => {
          return {
            id: option.id,
            code: option.code,
            description: option.description,
            isCountable: option.is_countable,
            isDefault: option.is_default,
            sequence: option.sequence
          };
        }),
        congDetails.max_tries || DEFAULT_CONGREGATION_MAX_TRIES,
        congDetails.origin || DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION,
        congregationAccessRef.current[id],
        congDetails.expiry_hours || DEFAULT_SELF_DESTRUCT_HOURS,
        congDetails.id
      )
    );

    const territoryMap = processCongregationTerritories(territoryRecords);
    setTerritories(territoryMap);

    if (territoryCodeCache && territoryMap.has(territoryCodeCache)) {
      setSelectedTerritory((prev) => ({
        ...prev,
        id: territoryCodeCache
      }));
    } else {
      setTerritoryCodeCache("");
    }

    return territoryMap;
  };

  const checkForMaps = async (congregationId: string) => {
    if (!congregationId) {
      setHasAnyMaps(false);
      return;
    }

    try {
      const maps = await getPaginatedList("maps", 1, 1, {
        filter: `congregation="${congregationId}"`,
        requestKey: null,
        fields: "id"
      });
      setHasAnyMaps(maps.items.length > 0);
    } catch {
      setHasAnyMaps(false);
    }
  };

  const loadAllCongregationData = async (congregationCode: string) => {
    setIsLoading(true);
    setUserAccessLevel(congregationAccessRef.current[congregationCode]);

    await Promise.all([
      fetchCongregationData(congregationCode),
      checkForMaps(congregationCode)
    ]);

    setIsLoading(false);
  };

  return {
    fetchData,
    fetchCongregationData,
    loadAllCongregationData,
    checkForMaps,
    isLoading,
    setIsLoading,
    hasAnyMaps,
    setHasAnyMaps
  };
}
