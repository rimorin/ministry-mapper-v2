import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import { UpdateProfileModalProps } from "../../utils/interface";
import { updateDataById } from "../../utils/pocketbase";

const GetProfile = NiceModal.create(({ user }: UpdateProfileModalProps) => {
  const modal = useModal();

  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState(user?.name || "");

  const UpdateProfile = async (event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateDataById(
        "users",
        user?.id as string,
        {
          name: username
        },
        {
          requestKey: `update-name-${user?.id}`
        }
      );
      alert("Profile updated.");
      modal.hide();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
      <Modal.Header>
        <Modal.Title>My Profile</Modal.Title>
      </Modal.Header>
      <Form onSubmit={UpdateProfile}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="userid">Email</Form.Label>
            <Form.Control
              readOnly
              disabled
              id="userid"
              defaultValue={user?.email || undefined}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="userid">Name</Form.Label>
            <Form.Control
              id="userid"
              defaultValue={username}
              onChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setUsername(value);
              }}
            />
          </Form.Group>
        </Modal.Body>
        <ModalFooter
          handleClick={modal.hide}
          userAccessLevel={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
          isSaving={isSaving}
          submitLabel="Update"
        />
      </Form>
    </Modal>
  );
});

export default GetProfile;
