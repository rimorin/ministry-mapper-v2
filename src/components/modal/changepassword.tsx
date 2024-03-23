import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { FirebaseError } from "firebase/app";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from "firebase/auth";
import { useState } from "react";
import {
  PASSWORD_POLICY,
  MINIMUM_PASSWORD_LENGTH
} from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import errorMessage from "../../utils/helpers/errormsg";
import ModalFooter from "../form/footer";
import PasswordChecklist from "react-password-checklist";
import {
  AlertSnackbarProps,
  ChangePasswordModalProps
} from "../../utils/interface";
// import {
//   DialogTitle,
//   DialogContent,
//   Modal,
//   ModalDialog,
//   Stack,
//   FormControl,
//   FormLabel,
//   Input
// } from "@mui/joy";
import { AlertContext } from "../utils/context";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  Input,
  Stack
} from "@mui/material";

const ChangePassword = NiceModal.create(
  ({ user, userAccessLevel }: ChangePasswordModalProps) => {
    const modal = useModal();
    const rollbar = useRollbar();
    const [existingPassword, setExistingPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangePasswordOk, setIsChangePasswordOk] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { setSnackbarAlert } = React.useContext(
      AlertContext
    ) as AlertSnackbarProps;

    const handleChangePassword = async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        setIsSaving(true);
        await reauthenticateWithCredential(
          user,
          EmailAuthProvider.credential(user.email || "", existingPassword)
        );
        await updatePassword(user, password);
        // alert("Password updated.");
        setSnackbarAlert({
          message: "Password updated successfully",
          color: "success",
          open: true
        });
        modal.hide();
      } catch (error) {
        errorHandler(errorMessage((error as FirebaseError).code), rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog> */}
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={handleChangePassword}>
          <DialogContent>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Existing Password</FormLabel>
                <Input
                  type="password"
                  name="existingPassword"
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    setExistingPassword(value);
                  }}
                  required
                />
                {/* <FormHelperText>This is a helper text.</FormHelperText> */}
              </FormControl>
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    setPassword(value);
                  }}
                  required
                />
                {/* <FormHelperText>This is a helper text.</FormHelperText> */}
              </FormControl>
              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  onChange={(event) => {
                    const { value } = event.target as HTMLInputElement;
                    setConfirmPassword(value);
                  }}
                  required
                />
                {/* <FormHelperText>This is a helper text.</FormHelperText> */}
              </FormControl>
              <FormControl>
                <PasswordChecklist
                  rules={PASSWORD_POLICY}
                  minLength={MINIMUM_PASSWORD_LENGTH}
                  value={password || ""}
                  valueAgain={confirmPassword || ""}
                  onChange={(isValid) => setIsChangePasswordOk(isValid)}
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <ModalFooter
            handleClick={() => modal.hide()}
            userAccessLevel={userAccessLevel}
            isSaving={isSaving}
            disableSubmitBtn={!isChangePasswordOk}
          />
        </form>
        {/* </ModalDialog> */}
        {/* <Form onSubmit={handleChangePassword}>
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
        </Form> */}
      </Dialog>
    );
  }
);

export default ChangePassword;
