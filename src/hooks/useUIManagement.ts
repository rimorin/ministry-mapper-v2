import { useState } from "react";
import { PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY } from "../utils/constants";

export default function useUIState() {
  const [showBkTopButton, setShowBkTopButton] = useState(false);
  const [isUnauthorised, setIsUnauthorised] = useState<boolean>(false);
  const [showChangeAddressTerritory, setShowChangeAddressTerritory] =
    useState<boolean>(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [values, setValues] = useState<object>({});
  const [isAssignmentLoading, setIsAssignmentLoading] =
    useState<boolean>(false);

  const handleScroll = (): void => {
    setShowBkTopButton(window.scrollY > PIXELS_TILL_BK_TO_TOP_BUTTON_DISPLAY);
  };

  const toggleAddressTerritoryListing = () => {
    setShowChangeAddressTerritory((existingState) => !existingState);
  };

  const toggleLanguageSelector = () => {
    setShowLanguageSelector((existingState) => !existingState);
  };

  return {
    showBkTopButton,
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
