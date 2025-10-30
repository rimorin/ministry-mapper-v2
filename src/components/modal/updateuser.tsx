import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";

import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { UserModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import UserRoleField from "../form/role";
import HelpButton from "../navigation/help";
import { deleteDataById, updateDataById } from "../../utils/pocketbase";

const UpdateUser = NiceModal.create(
  ({
    uid,
    name,
    role = USER_ACCESS_LEVELS.NO_ACCESS.CODE,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const [userRole, setUserRole] = useState(role);
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleUserDetails = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (userRole === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
          await deleteDataById("roles", uid, {
            requestKey: `delete-usr-role-${uid}`
          });
        } else {
          await updateDataById(
            "roles",
            uid,
            { role: userRole },
            {
              requestKey: `update-usr-role-${uid}`
            }
          );
        }
        modal.resolve(userRole);
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>{t("user.updateRole", { name })}</Modal.Title>
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
