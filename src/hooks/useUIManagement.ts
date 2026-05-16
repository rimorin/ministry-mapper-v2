import { useState } from "react";

export default function useUIState() {
  const [showBkTopButton, setShowBkTopButton] = useState(false);
  const [isUnauthorised, setIsUnauthorised] = useState<boolean>(false);
  const [showChangeAddressTerritory, setShowChangeAddressTerritory] =
    useState<boolean>(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [values, setValues] = useState<object>({});
  const [isAssignmentLoading, setIsAssignmentLoading] =
    useState<boolean>(false);

  const toggleAddressTerritoryListing = () => {
    setShowChangeAddressTerritory((existingState) => !existingState);
  };

  const toggleLanguageSelector = () => {
    setShowLanguageSelector((existingState) => !existingState);
  };

  return {
    showBkTopButton,
    setShowBkTopButton,
    isUnauthorised,
    setIsUnauthorised,
    showChangeAddressTerritory,
    showLanguageSelector,
    values,
    setValues,
    isAssignmentLoading,
    setIsAssignmentLoading,
    toggleAddressTerritoryListing,
    toggleLanguageSelector
  };
}
