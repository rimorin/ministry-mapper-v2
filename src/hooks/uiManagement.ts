import { useState, useCallback } from "react";
import { PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY } from "../utils/constants";

export default function useUIState() {
  const [showBkTopButton, setShowBkTopButton] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorised, setIsUnauthorised] = useState<boolean>(false);
  const [showChangeAddressTerritory, setShowChangeAddressTerritory] =
    useState<boolean>(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [values, setValues] = useState<object>({});
  const [isAssignmentLoading, setIsAssignmentLoading] =
    useState<boolean>(false);

  const handleScroll = useCallback(() => {
    setShowBkTopButton(window.scrollY > PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY);
  }, []);

  const toggleAddressTerritoryListing = useCallback(() => {
    setShowChangeAddressTerritory((existingState) => !existingState);
  }, []);

  const toggleLanguageSelector = useCallback(() => {
    setShowLanguageSelector((existingState) => !existingState);
  }, []);

  return {
    showBkTopButton,
    isLoading,
    setIsLoading,
    isUnauthorised,
    setIsUnauthorised,
    showChangeAddressTerritory,
    showLanguageSelector,
    values,
    setValues,
    isAssignmentLoading,
    setIsAssignmentLoading,
    handleScroll,
    toggleAddressTerritoryListing,
    toggleLanguageSelector
  };
}
