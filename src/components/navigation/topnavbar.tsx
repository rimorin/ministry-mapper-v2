import { Container, Image, Navbar } from "react-bootstrap";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import ExpiryBadge from "./expirybadge";
import PendingBadge from "./pendingbadge";
import "../../css/networkstatus.css";

interface TopNavbarProps {
  title: string;
  tokenEndTime?: number;
  pendingCount?: number;
}

const TopNavbar = ({
  title,
  tokenEndTime = 0,
  pendingCount = 0
}: TopNavbarProps) => {
  return (
    <Navbar expand="sm">
      <Container fluid>
        <Navbar.Brand
          className="brand-wrap d-flex align-items-center"
          style={{ width: "100%", marginRight: 0 }}
        >
          <div style={{ flex: 0, textAlign: "left", marginRight: 10 }}>
            <Image
              src={getAssetUrl("favicon-32x32.png")}
              alt=""
              width="32"
              height="32"
              className="d-inline-block align-top"
            />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <Navbar.Text className="fluid-bolding fluid-text">
              {title}
            </Navbar.Text>
          </div>
          {pendingCount > 0 && (
            <div style={{ flex: 0, marginLeft: 10 }}>
              <PendingBadge count={pendingCount} />
            </div>
          )}
          {tokenEndTime > 0 && (
            <div style={{ flex: 0, marginLeft: 10 }}>
              <ExpiryBadge endtime={tokenEndTime} />
            </div>
          )}
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
