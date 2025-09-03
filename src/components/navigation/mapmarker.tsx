import React, { useEffect, useState } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import CircularProgress from "../map/circularprogress";
import { addressDetails } from "../../utils/interface";
import { LINK_TYPES } from "../../utils/constants";
import {
  getFirstItemOfList,
  setupRealtimeListener
} from "../../utils/pocketbase";

interface AddressMarkerProps {
  addressElement: addressDetails;
  isSelected: boolean;
  onClick: () => void;
}

const AddressMarker: React.FC<AddressMarkerProps> = ({
  addressElement,
  isSelected,
  onClick
}) => {
  const [hasAssignments, setHasAssignments] = useState<boolean>(false);
  const [hasPersonal, setHasPersonal] = useState<boolean>(false);

  useEffect(() => {
    const mapId = addressElement.id;
    const fetchAssignmentsAndPersonals = async () => {
      const hasAssignments = await getFirstItemOfList(
        "assignments",
        `map="${mapId}" && type="${LINK_TYPES.ASSIGNMENT}"`,
        {
          fields: "id",
          requestKey: `marker-assignments-${mapId}`
        }
      );
      const hasPersonal = await getFirstItemOfList(
        "assignments",
        `map="${mapId}" && type="${LINK_TYPES.PERSONAL}"`,
        {
          fields: "id",
          requestKey: `marker-personal-${mapId}`
        }
      );

      setHasAssignments(!!hasAssignments);
      setHasPersonal(!!hasPersonal);
    };

    setupRealtimeListener(
      "assignments",
      () => {
        fetchAssignmentsAndPersonals();
      },
      {
        filter: `map="${addressElement.id}"`,
        fields: "id",
        requestKey: null
      }
    );

    fetchAssignmentsAndPersonals();
  }, []);

  return (
    <AdvancedMarker
      position={addressElement.coordinates}
      onClick={onClick}
      className={isSelected ? "selected-marker" : ""}
    >
      <CircularProgress
        size={55}
        progress={addressElement.aggregates.value}
        strokeWidth={3}
        highlightColor="#00f"
        backgroundColor="#ddd"
        hasAssignments={hasAssignments}
        hasPersonal={hasPersonal}
      >
        {addressElement.aggregates.display}
      </CircularProgress>
    </AdvancedMarker>
  );
};

export default AddressMarker;
