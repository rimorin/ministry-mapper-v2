import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  userDetails,
  CongregationAccessObject,
  CongregationManagementOptions
} from "../utils/interface";
import { Policy } from "../utils/policies";
import { DEFAULT_SELF_DESTRUCT_HOURS } from "../utils/constants";
import useNotification from "./useNotification";
import { callFunction } from "../utils/pocketbase";
import getCongregationUsers from "../utils/helpers/getcongregationusers";
import useLocalStorage from "./useLocalStorage";
import useAnalytics, { ANALYTICS_EVENTS } from "./useAnalytics";

export default function useCongregationManagement({
  userId
}: CongregationManagementOptions) {
  const { t } = useTranslation();
  const { notifyInfo, runAction } = useNotification();
  const { trackEvent } = useAnalytics();
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
    await runAction(
      async () => {
        setCongregationUsers(
          await getCongregationUsers(congregationCode, userId)
        );
        toggleUserListing();
      },
      { setLoading: setIsShowingUserListing }
    );
  };

  const handleCongregationSelect = (newCongCode: string | null) => {
    const selectedCode = newCongCode as string;
    setCongregationCodeCache(selectedCode);
    setCongregationCode(selectedCode);
    setCongregationName("");
    toggleCongregationListing();
  };

  const generateReport = async () => {
    await runAction(async () => {
      await callFunction("/report/generate", {
        method: "POST",
        body: { congregation: congregationCode }
      });
      trackEvent(ANALYTICS_EVENTS.REPORT_GENERATED);
      notifyInfo(
        t(
          "congregation.reportGenerationStarted",
          "Report generation started. You will receive an email shortly."
        )
      );
    });
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
    handleCongregationSelect,
    generateReport
  };
}
