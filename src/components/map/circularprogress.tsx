import React from "react";
import { CircularProgressProps } from "../../utils/interface";

const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  progress,
  strokeWidth,
  highlightColor,
  backgroundColor,
  hasAssignments,
  hasPersonal,
  isSelected = false,
  children
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div
      className="circular-progress-container"
      style={{ width: size, height: size, backgroundColor }}
    >
      <svg width={size} height={size} className="circular-progress">
        {isSelected && (
          <circle
            className="selected-marker-ring"
            fill="none"
            cx={center}
            cy={center}
            r={radius + strokeWidth + 2}
          />
        )}
        <circle
          className="circular-progress-background"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          cx={center}
          cy={center}
          r={radius}
        />
        <circle
          className="circular-progress-highlight"
          stroke={highlightColor}
          strokeWidth={strokeWidth}
          fill="none"
          cx={center}
          cy={center}
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset
          }}
        />
        {hasAssignments && (
          <circle
            className="circular-progress-assignments"
            fill="none"
            cx={center}
            cy={center}
            r={radius - strokeWidth - 2}
          />
        )}
        {hasPersonal && (
          <circle
            className="circular-progress-personal"
            fill="none"
            cx={center}
            cy={center}
            r={radius - strokeWidth - 6}
          />
        )}
      </svg>
      <div className="circular-progress-center">{children}</div>
    </div>
  );
};

export default CircularProgress;
