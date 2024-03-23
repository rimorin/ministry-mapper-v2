import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { FirebaseError } from "firebase/app";
import { updateProfile } from "firebase/auth";
import { useState, FormEvent, ChangeEvent } from "react";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import errorMessage from "../../utils/helpers/errormsg";
import ModalFooter from "../form/footer";
import {
  AlertSnackbarProps,
  UpdateProfileModalProps
} from "../../utils/interface";
// import {
//   DialogContent,
//   DialogTitle,
//   FormControl,
//   FormLabel,
//   Input,
//   Modal,
//   ModalDialog,
//   Stack
// } from "@mui/joy";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import React from "react";
import { AlertContext } from "../utils/context";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  Input,
  Stack
} from "@mui/material";

const GetProfile = NiceModal.create(({ user }: UpdateProfileModalProps) => {
  const modal = useModal();
  const rollbar = useRollbar();
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState(user.displayName || "");
  const { setSnackbarAlert } = React.useContext(
    AlertContext
  ) as AlertSnackbarProps;

  const UpdateProfile = async (event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: username
      });
      // update firestore user collection display name
      await updateDoc(doc(firestore, "users", user.uid), {
        displayName: username
      });

      setSnackbarAlert({
        message: "Profile updated successfully",
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
    <Dialog
      open={modal.visible}
      onClose={() => modal.hide()}
      TransitionProps={{
        onExited: () => modal.remove()
      }}
    >
      <DialogTitle>My Profile</DialogTitle>
      <form onSubmit={UpdateProfile}>
        <DialogContent>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input readOnly disabled value={user.email || undefined} />
              {/* <FormHelperText>This is a helper text.</FormHelperText> */}
            </FormControl>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={username}
                onChange={(e: ChangeEvent<HTMLElement>) => {
                  const { value } = e.target as HTMLInputElement;
                  setUsername(value);
                }}
              />
              {/* <FormHelperText>This is a helper text.</FormHelperText> */}
            </FormControl>
          </Stack>
        </DialogContent>
        <ModalFooter
          handleClick={modal.hide}
          userAccessLevel={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
          isSaving={isSaving}
          submitLabel="Update"
        />
      </form>
    </Dialog>
  );

  {
    /* <form onSubmit={UpdateProfile}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="userid">Email</Form.Label>
            <Form.Control
              readOnly
              disabled
              id="userid"
              defaultValue={user.email || undefined}
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
        </Modal.Body> */
  }
});

export default GetProfile;
