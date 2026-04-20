import React, { useEffect, useState } from "react";
import { Marker } from "react-leaflet";
import { divIcon } from "leaflet";
import { addressDetails, AssignmentStatus } from "../../utils/interface";
import { LINK_TYPES } from "../../utils/constants";
import { getList, ignoreAbort } from "../../utils/pocketbase";
import useRealtimeSubscription from "../../hooks/useRealtime";

interface AddressMarkerProps {
  addressElement: addressDetails;
  initialStatus?: AssignmentStatus;
  isSelected: boolean;
  onClick: () => void;
}

const ICON_SIZE = 55;
const STROKE_WIDTH = 3;
const CENTER = ICON_SIZE / 2;
const RADIUS = (ICON_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AddressMarker: React.FC<AddressMarkerProps> = ({
  addressElement,
  initialStatus,
  isSelected,
  onClick
}) => {
  const [hasAssignments, setHasAssignments] = useState(
    initialStatus?.hasAssignments ?? false
  );
  const [hasPersonal, setHasPersonal] = useState(
    initialStatus?.hasPersonal ?? false
  );

  const mapId = addressElement.id;

  // Sync state if the parent bulk-fetch resolves after this marker mounts
  useEffect(() => {
    if (initialStatus) {
      setHasAssignments(initialStatus.hasAssignments);
      setHasPersonal(initialStatus.hasPersonal);
    }
  }, [initialStatus]);

  const fetchData = ignoreAbort(async () => {
    const assignments = await getList("assignments", {
      filter: `map="${mapId}" && expiry_date >= @now`,
      fields: "id, type",
      requestKey: `marker-assignments-${mapId}`
    });
    setHasAssignments(
      assignments.some((a) => a.type === LINK_TYPES.ASSIGNMENT)
    );
    setHasPersonal(assignments.some((a) => a.type === LINK_TYPES.PERSONAL));
  });

  useRealtimeSubscription(
    "assignments",
    (data) => {
      const { action, record } = data;
      if (action === "create") {
        if (record.type === LINK_TYPES.ASSIGNMENT) setHasAssignments(true);
        if (record.type === LINK_TYPES.PERSONAL) setHasPersonal(true);
      } else if (action === "delete" || action === "update") {
        fetchData();
      }
    },
    {
      filter: `map="${mapId}" && expiry_date >= @now`,
      fields: "id, type"
    },
    [mapId],
    !!mapId
  );

  const wrapperClasses = [
    isSelected && "marker-selected",
    hasAssignments && "marker-has-assignments",
    hasPersonal && "marker-has-personal"
  ]
    .filter(Boolean)
    .join(" ");

  const offset = CIRCUMFERENCE * (1 - addressElement.aggregates.value / 100);
  const innerRadius1 = RADIUS - STROKE_WIDTH - 2;
  const innerRadius2 = RADIUS - STROKE_WIDTH - 6;
  const outerRadius = RADIUS + STROKE_WIDTH + 2;

  const markerIcon = divIcon({
    html: `<div class="circular-progress-container">
      <svg class="circular-progress" width="${ICON_SIZE}" height="${ICON_SIZE}">
        <circle class="circular-progress-background" cx="${CENTER}" cy="${CENTER}" r="${RADIUS}"/>
        <circle class="circular-progress-highlight" cx="${CENTER}" cy="${CENTER}" r="${RADIUS}" style="stroke-dasharray:${CIRCUMFERENCE};stroke-dashoffset:${offset}"/>
        <circle class="circular-progress-assignments" cx="${CENTER}" cy="${CENTER}" r="${innerRadius1}"/>
        <circle class="circular-progress-personal" cx="${CENTER}" cy="${CENTER}" r="${innerRadius2}"/>
        <circle class="selected-marker-ring" cx="${CENTER}" cy="${CENTER}" r="${outerRadius}"/>
      </svg>
      <div class="circular-progress-center">${addressElement.aggregates.display}</div>
    </div>`,
    className: wrapperClasses,
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [CENTER, CENTER]
  });

  return (
    <Marker
      position={[
        addressElement.coordinates.lat,
        addressElement.coordinates.lng
      ]}
      icon={markerIcon}
      eventHandlers={{ click: onClick }}
    />
  );
};

export default AddressMarker;
