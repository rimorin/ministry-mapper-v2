import { Container, Image, Navbar } from "react-bootstrap";
import { getAssetUrl } from "../../utils/helpers/assetpath";

interface TopNavbarProps {
  title: string;
  onLegendClick: () => void;
}

const TopNavbar = ({ title, onLegendClick }: TopNavbarProps) => {
  return (
    <Navbar bg="light" expand="sm">
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
          <div style={{ flex: 0, textAlign: "right", marginLeft: 10 }}>
            <Image
              src={getAssetUrl("information.svg")}
              alt="Legend"
              onClick={onLegendClick}
            />
          </div>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
