import { memo } from "react";
import { ACCESS_LEVEL_MAPPING } from "../../utils/constants";
import { AuthorizerProp } from "../../utils/interface";

const ComponentAuthorizer = memo(
  ({ requiredPermission, userPermission, children }: AuthorizerProp) => {
    if (!userPermission) return <></>;
    const requiredPermissionLvl = ACCESS_LEVEL_MAPPING[requiredPermission];
    const userPermissionLvl = ACCESS_LEVEL_MAPPING[userPermission];
    const isUnAuthorized = userPermissionLvl < requiredPermissionLvl;
    if (isUnAuthorized) {
      return <></>;
    }
    return children;
  }
);

export default ComponentAuthorizer;
