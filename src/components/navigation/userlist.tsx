import { memo } from "react";
import { Offcanvas, ListGroup } from "react-bootstrap";
import { TERRITORY_SELECTOR_VIEWPORT_HEIGHT } from "../../utils/constants";
import { UserListingProps } from "../../utils/interface";
import UserRoleBadge from "./rolebadge";
import { useTranslation } from "react-i18next";

const UserListing = memo(
  ({ showListing, hideFunction, handleSelect, users }: UserListingProps) => {
    const { t } = useTranslation();
    return (
      <Offcanvas
        placement={"bottom"}
        show={showListing}
        onHide={hideFunction}
        style={{ height: TERRITORY_SELECTOR_VIEWPORT_HEIGHT }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{t("user.selectUser")}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ListGroup onSelect={handleSelect}>
            {users &&
              users.map((element) => (
                <ListGroup.Item
                  action
                  key={`list-group-item-${element.roleId}`}
                  eventKey={element.roleId}
                >
                  <div
                    style={{ justifyContent: "space-between", display: "flex" }}
                  >
                    <span className="fw-bold">{element.name}</span>
                    <span>
                      <UserRoleBadge role={element.role.toString()} />
                    </span>
                  </div>
                  <div className="me-auto">{element.email}</div>
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
    );
  }
);

export default UserListing;
