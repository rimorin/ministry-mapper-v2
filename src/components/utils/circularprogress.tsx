import React from "react";

interface CircularProgressProps {
  size: number;
  progress: number; // Progress in percentage (0-100)
  strokeWidth: number;
  highlightColor: string;
  backgroundColor: string;
  hasAssignments: boolean; // Add hasAssignments prop
  hasPersonal: boolean; // Add hasPersonal prop
  children?: React.ReactNode; // Add children prop
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  progress,
  strokeWidth,
  highlightColor,
  backgroundColor,
  hasAssignments, // Destructure hasAssignments
  hasPersonal, // Destructure hasPersonal
  children // Destructure children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="circular-progress-container"
      style={{ width: size, height: size, backgroundColor: backgroundColor }}
    >
      <svg width={size} height={size} className="circular-progress">
        <circle
          className="circular-progress-background"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className="circular-progress-highlight"
          stroke={highlightColor}
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
        {hasAssignments && (
          <circle
            className="circular-progress-assignments"
            stroke="red"
            strokeWidth={5} // Thicker red ring for assignments
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth - 2} // Adjust radius for the ring
          />
        )}
        {hasPersonal && (
          <circle
            className="circular-progress-personal"
            stroke="green"
            strokeWidth={3} // Thinner green ring for personal
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth - 6} // Adjust radius for the ring
          />
        )}
      </svg>
      <div className="circular-progress-center">{children}</div>
    </div>
  );
};

export default CircularProgress;
