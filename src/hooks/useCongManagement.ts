import { useState, useRef } from "react";
import {
  userDetails,
  CongregationAccessObject,
  CongregationManagementOptions
} from "../utils/interface";
import { Policy } from "../utils/policies";
import { DEFAULT_SELF_DESTRUCT_HOURS } from "../utils/constants";
import useNotification from "./useNotification";
import getCongregationUsers from "../utils/helpers/getcongregationusers";
import useLocalStorage from "./useLocalStorage";

export default function useCongregationManagement({
  userId
}: CongregationManagementOptions) {
  const { notifyError } = useNotification();
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

  const toggleCongregationListing = () => {
    setShowCongregationListing((existingState) => !existingState);
  };

  const toggleUserListing = () => {
    setShowUserListing((existingState) => !existingState);
  };

  const getUsers = async () => {
    try {
      setIsShowingUserListing(true);
      setCongregationUsers(
        await getCongregationUsers(congregationCode, userId)
      );
      toggleUserListing();
    } catch (error) {
      notifyError(error);
    } finally {
      setIsShowingUserListing(false);
    }
  };

  const handleCongregationSelect = (newCongCode: string | null) => {
    const selectedCode = newCongCode as string;
    setCongregationCodeCache(selectedCode);
    setCongregationCode(selectedCode);
    setCongregationName("");
    toggleCongregationListing();
  };

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
