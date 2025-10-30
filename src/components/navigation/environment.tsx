import { lazy } from "react";
import SuspenseComponent from "../utils/suspense";
import { EnvironmentIndicatorProps } from "../../utils/interface";
const ProgressBar = SuspenseComponent(
  lazy(() => import("react-bootstrap/ProgressBar"))
);

const EnvironmentIndicator = ({
  environment = "production"
}: EnvironmentIndicatorProps) => {
  if (environment.startsWith("production")) return <></>;
  return (
    <ProgressBar
      now={100}
      animated
      style={{
        borderRadius: 0,
        position: "sticky",
        top: 0,
        fontWeight: "bold",
        zIndex: 1000
      }}
      label={`${environment} environment`}
    />
  );
};

export default EnvironmentIndicator;
