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

// At 0 and 100 the gradient's stops collapse onto the 0deg/360deg seam and
// browsers paint a hairline there, reading as an unclosed ring. Neither case has
// a remainder to draw, so both get a flat fill instead.
const trackFill = (progress: number) =>
  progress >= 100 ? "full" : progress <= 0 ? "empty" : "partial";

// Progress rides in as a custom property because Tailwind cannot generate a
// class from a runtime value. Dials precede the value so the number paints over
// them; CSS hides each until its wrapper class applies.
export const buildProgressMarkerHtml = (display: string, progress: number) =>
  `<div class="map-progress" style="--progress:${progress}">` +
  `<span class="map-progress-track" data-fill="${trackFill(progress)}"></span>` +
  `<span class="map-progress-dial" data-dial="assignment"></span>` +
  `<span class="map-progress-dial" data-dial="personal"></span>` +
  `<span class="map-progress-value">${display}</span>` +
  `</div>`;

export const buildMarkerClasses = (
  isSelected: boolean,
  hasAssignments: boolean,
  hasPersonal: boolean
) =>
  [
    isSelected && "marker-selected",
    hasAssignments && "marker-has-assignments",
    hasPersonal && "marker-has-personal"
  ]
    .filter(Boolean)
    .join(" ");

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

  const markerIcon = divIcon({
    html: buildProgressMarkerHtml(
      addressElement.aggregates.display,
      addressElement.aggregates.value
    ),
    className: buildMarkerClasses(isSelected, hasAssignments, hasPersonal),
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2]
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
