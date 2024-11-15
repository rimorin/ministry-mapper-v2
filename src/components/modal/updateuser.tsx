import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { pb } from "../../pocketbase";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { UserModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import UserRoleField from "../form/role";
import HelpButton from "../navigation/help";
import { usePostHog } from "posthog-js/react";

const UpdateUser = NiceModal.create(
  ({
    uid,
    name,
    role = USER_ACCESS_LEVELS.NO_ACCESS.CODE,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const [userRole, setUserRole] = useState(role);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();
    const posthog = usePostHog();

    const handleUserDetails = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (userRole === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
          await pb.collection("roles").delete(uid);
        } else {
          await pb.collection("roles").update(uid, {
            role: userRole
          });
        }
        posthog?.capture("update_user_role", {
          uid: uid,
          role: userRole
        });
        modal.resolve(userRole);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Update {name} Role</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.MANAGE_USERS} />
        </Modal.Header>
        <Form onSubmit={handleUserDetails}>
          <Modal.Body>
            <Form.Group
              className="mb-1 text-center"
              controlId="formBasicUsrRolebtnCheckbox"
            >
              <UserRoleField
                role={userRole}
                handleRoleChange={(value) => setUserRole(value)}
              />
            </Form.Group>
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default UpdateUser;
