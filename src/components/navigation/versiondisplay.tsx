import { FC } from "react";

const VersionDisplay: FC = () => {
  const { VITE_SYSTEM_ENVIRONMENT, VITE_VERSION } = import.meta.env;

  if (!VITE_SYSTEM_ENVIRONMENT?.startsWith("production")) {
    return null;
  }

  return (
    <div className="fixed-bottom text-muted opacity-25 m-2">
      v{VITE_VERSION}
    </div>
  );
};

export default VersionDisplay;
