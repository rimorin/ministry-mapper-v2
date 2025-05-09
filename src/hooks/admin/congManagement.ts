import { useState, useCallback, useRef } from "react";
import { userDetails, CongregationAccessObject } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { DEFAULT_SELF_DESTRUCT_HOURS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import getCongregationUsers from "../../utils/helpers/getcongregationusers";
import useLocalStorage from "../../utils/helpers/storage";

interface CongregationManagementOptions {
  userId: string;
}

export default function useCongregationManagement({
  userId
}: CongregationManagementOptions) {
  const [congregationName, setCongregationName] = useState<string>("");
  const [congregationUsers, setCongregationUsers] = useState(
    new Map<string, userDetails>()
  );
  const [showCongregationListing, setShowCongregationListing] =
    useState<boolean>(false);
  const [showUserListing, setShowUserListing] = useState<boolean>(false);
  const [isShowingUserListing, setIsShowingUserListing] =
    useState<boolean>(false);
  const [userAccessLevel, setUserAccessLevel] = useState<string>();
  const [defaultExpiryHours, setDefaultExpiryHours] = useState<number>(
    DEFAULT_SELF_DESTRUCT_HOURS
  );
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [userCongregationAccesses, setUserCongregationAccesses] = useState<
    CongregationAccessObject[]
  >([]);
  const [congregationCode, setCongregationCode] = useState<string>("");
  const [congregationCodeCache, setCongregationCodeCache] = useLocalStorage(
    "congregationCode",
    ""
  );
  const congregationAccess = useRef<Record<string, string>>({});

  const toggleCongregationListing = useCallback(() => {
    setShowCongregationListing((existingState) => !existingState);
  }, []);

  const toggleUserListing = useCallback(() => {
    setShowUserListing((existingState) => !existingState);
  }, []);

  const getUsers = useCallback(async () => {
    try {
      setIsShowingUserListing(true);
      setCongregationUsers(
        await getCongregationUsers(congregationCode, userId)
      );
      toggleUserListing();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsShowingUserListing(false);
    }
  }, [congregationCode, userId, toggleUserListing]);

  const handleCongregationSelect = useCallback(
    (newCongCode: string | null) => {
      const selectedCode = newCongCode as string;
      setCongregationCodeCache(selectedCode);
      setCongregationCode(selectedCode);
      setCongregationName("");
      toggleCongregationListing();
    },
    [toggleCongregationListing]
  );

  return {
    congregationName,
    setCongregationName,
    congregationUsers,
    setCongregationUsers,
    showCongregationListing,
    showUserListing,
    isShowingUserListing,
    toggleCongregationListing,
    toggleUserListing,
    getUsers,
    userAccessLevel,
    setUserAccessLevel,
    defaultExpiryHours,
    setDefaultExpiryHours,
    policy,
    setPolicy,
    userCongregationAccesses,
    setUserCongregationAccesses,
    congregationCode,
    setCongregationCode,
    congregationCodeCache,
    setCongregationCodeCache,
    congregationAccess,
    handleCongregationSelect
  };
}
