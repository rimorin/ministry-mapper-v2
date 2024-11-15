import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState } from "react";
import { Modal, Form } from "react-bootstrap";
import {
  PASSWORD_POLICY,
  MINIMUM_PASSWORD_LENGTH
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import ModalFooter from "../form/footer";
import PasswordChecklist from "react-password-checklist";
import { ChangePasswordModalProps } from "../../utils/interface";
import { usePostHog } from "posthog-js/react";
import { pb } from "../../pocketbase";

const ChangePassword = NiceModal.create(
  ({ user, userAccessLevel }: ChangePasswordModalProps) => {
    const modal = useModal();
    const rollbar = useRollbar();
    const [existingPassword, setExistingPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangePasswordOk, setIsChangePasswordOk] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const posthog = usePostHog();

    const handleChangePassword = async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        setIsSaving(true);
        await pb.collection("users").update(
          user?.id,
          {
            password,
            passwordConfirm: confirmPassword,
            oldPassword: existingPassword
          },
          {
            requestKey: `users-pw-${user?.id}`
          }
        );
        await pb.collection("users").authWithPassword(user?.email, password);
        posthog?.capture("change_password", { email: user?.email });
        alert("Password updated.");
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
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleChangePassword}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formBasicExistingPassword">
              <Form.Label>Existing Password</Form.Label>
              <Form.Control
                type="password"
                name="existingPassword"
                onChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setExistingPassword(value);
                }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicNewPassword">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                onChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setPassword(value);
                }}
                required
              />
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formBasicConfirmNewPassword"
            >
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                onChange={(event) => {
                  const { value } = event.target as HTMLInputElement;
                  setConfirmPassword(value);
                }}
                required
              />
            </Form.Group>
            <PasswordChecklist
              rules={PASSWORD_POLICY}
              minLength={MINIMUM_PASSWORD_LENGTH}
              value={password || ""}
              valueAgain={confirmPassword || ""}
              onChange={(isValid) => setIsChangePasswordOk(isValid)}
            />
          </Modal.Body>
          <ModalFooter
            handleClick={() => modal.hide()}
            userAccessLevel={userAccessLevel}
            isSaving={isSaving}
            disableSubmitBtn={!isChangePasswordOk}
          />
        </Form>
      </Modal>
    );
  }
);

export default ChangePassword;
