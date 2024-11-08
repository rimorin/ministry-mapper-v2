import { FC, lazy, ReactNode, Suspense } from "react";
import { Container } from "react-bootstrap";
import VersionDisplay from "../navigation/versiondisplay";
import EnvironmentIndicator from "../navigation/environment";
import Loader from "../statics/loader";
const MissingSetupPage = lazy(() => import("../statics/missingsetup"));
const { VITE_SYSTEM_ENVIRONMENT } = import.meta.env;
interface MainMiddlewareProps {
  children: ReactNode;
}

const MainMiddleware: FC<MainMiddlewareProps> = ({ children }) => {
  const { VITE_POCKETBASE_URL } = import.meta.env;
  if (!VITE_POCKETBASE_URL) {
    return (
      <Suspense fallback={<Loader suspended />}>
        <MissingSetupPage message="Missing PocketBase URL" />
      </Suspense>
    );
  }
  return (
    <Container
      className="p-2"
      fluid
      style={{
        minHeight: "95vh"
      }}
    >
      <EnvironmentIndicator environment={VITE_SYSTEM_ENVIRONMENT} />
      {children}
      <VersionDisplay />
    </Container>
  );
};

export default MainMiddleware;
