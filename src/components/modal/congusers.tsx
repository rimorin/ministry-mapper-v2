import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import ModalFooter from "../form/footer";
import { firestore } from "../../firebase";
import { useEffect, useRef, useState } from "react";
import { AlertSnackbarProps, CongUsersProps } from "../../utils/interface";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
// import {
//   Box,
//   Button,
//   DialogContent,
//   DialogTitle,
//   IconButton,
//   Input,
//   List,
//   ListDivider,
//   ListItem,
//   ListItemContent,
//   ListItemDecorator,
//   Modal,
//   ModalDialog,
//   Option,
//   Select,
//   Typography
// } from "@mui/joy";
import React from "react";
import { AlertContext } from "../utils/context";
import { flushSync } from "react-dom";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography
} from "@mui/material";

const GetCongregationUsers = NiceModal.create(
  ({ congregation }: CongUsersProps) => {
    const modal = useModal();
    const [users, setUsers] = useState<
      Array<{
        id: string;
        access: number;
        email: string;
        name: string;
      }>
    >([]);
    const [inputValue, setInputValue] = useState("");
    const [selectValue, setSelectValue] = useState(
      USER_ACCESS_LEVELS.READ_ONLY.CODE
    );
    const { setSnackbarAlert } = React.useContext(
      AlertContext
    ) as AlertSnackbarProps;

    // useref for list
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let unsubscribe = null as any;

      if (modal.visible) {
        unsubscribe = onSnapshot(
          query(
            collection(firestore, "users"),
            where(`access.${congregation}`, ">", 0)
          ),
          (snapshot) => {
            const userListing = [] as Array<{
              id: string;
              access: number;
              email: string;
              name: string;
            }>;
            snapshot.docs.forEach((user) => {
              const data = user.data();
              userListing.push({
                id: user.id,
                email: data.email,
                name: data.display_name,
                access: data.access[congregation]
              });
            });
            // sort userListing by name
            userListing.sort((a, b) => {
              if (a.name < b.name) {
                return -1;
              }
              if (a.name > b.name) {
                return 1;
              }
              return 0;
            });
            setUsers(userListing);
          },
          (error) => {
            console.error("Error fetching users: ", error);
          }
        );
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [modal.visible]);

    const hasNewUser = users.some((user) => user.id === "");

    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()}>
        {/* <ModalDialog size="lg"> */}
        <DialogTitle>Users</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              maxHeight: 350,
              overflow: "auto",
              borderRadius: "sm"
            }}
          >
            <List ref={listRef}>
              {users.map((user, index) => {
                const userRefId = user.id;
                return (
                  <Box key={`user-${index}`}>
                    <ListItem>
                      <ListItemIcon>
                        {userRefId ? (
                          <IconButton
                            onClick={async () => {
                              const userData = await getDoc(
                                doc(firestore, "users", user.id)
                              );
                              if (!userData.exists()) return;
                              const data = userData.data().access;
                              delete data[congregation];
                              updateDoc(doc(firestore, "users", user.id), {
                                access: data
                              });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={async () => {
                              // query state for user email
                              if (!inputValue) {
                                setSnackbarAlert({
                                  open: true,
                                  message: "Please enter a valid email",
                                  color: "danger"
                                });
                                return;
                              }

                              // query user state for user email
                              if (
                                users.some((user) => user.email === inputValue)
                              ) {
                                setSnackbarAlert({
                                  open: true,
                                  message: `User with email ${inputValue} already added.`,
                                  color: "danger"
                                });
                                return;
                              }

                              // query user collection for email
                              const userQuery = query(
                                collection(firestore, "users"),
                                where("email", "==", inputValue)
                              );

                              const userQuerySnapshot = await getDocs(
                                userQuery
                              );

                              if (userQuerySnapshot.size === 0) {
                                setSnackbarAlert({
                                  open: true,
                                  message: `User with email ${inputValue} not found. Please ensure the user has an account.`,
                                  color: "danger"
                                });
                                return;
                              }

                              const user = userQuerySnapshot.docs[0];
                              const data = user.data();
                              const currentAccess = data.access;
                              console.log(
                                `current selected value: ${selectValue}`
                              );

                              // update user access for congregation in user collection
                              currentAccess[congregation] = selectValue;

                              // update user access in user collection

                              await updateDoc(user.ref, {
                                access: currentAccess
                              });

                              setInputValue("");
                              setSelectValue(USER_ACCESS_LEVELS.READ_ONLY.CODE);
                            }}
                          >
                            <PersonAddIcon />
                          </IconButton>
                        )}
                      </ListItemIcon>
                      <ListItemText>
                        {userRefId.length > 0 ? (
                          <Box>
                            {user.name && (
                              <Typography variant="subtitle2">
                                {user.name}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              {user.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Input
                            value={inputValue}
                            type="email"
                            onChange={(e) => setInputValue(e.target.value)}
                          />
                        )}
                      </ListItemText>

                      {userRefId.length > 0 ? (
                        <Select
                          key={userRefId}
                          defaultValue={user.access}
                          onChange={async (
                            event: SelectChangeEvent<number>
                          ) => {
                            if (!userRefId) return;
                            const updatedAccess = event.target.value as number;

                            // update user access for congregation in user collection
                            const userRef = doc(firestore, "users", userRefId);
                            const userDoc = await getDoc(userRef);
                            const userAccess = userDoc.data()?.access;
                            userAccess[congregation] = updatedAccess;
                            // update user access in user collection
                            updateDoc(userRef, {
                              access: userAccess
                            });
                          }}
                          sx={{
                            width: "160px",
                            textAlign: "end",
                            borderRadius: "sm"
                          }}
                        >
                          <MenuItem value={USER_ACCESS_LEVELS.READ_ONLY.CODE}>
                            {USER_ACCESS_LEVELS.READ_ONLY.DISPLAY}
                          </MenuItem>
                          <MenuItem value={USER_ACCESS_LEVELS.CONDUCTOR.CODE}>
                            {USER_ACCESS_LEVELS.CONDUCTOR.DISPLAY}
                          </MenuItem>
                          <MenuItem
                            value={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                          >
                            {USER_ACCESS_LEVELS.TERRITORY_SERVANT.DISPLAY}
                          </MenuItem>
                        </Select>
                      ) : (
                        <Select
                          defaultValue={selectValue}
                          onChange={(event: SelectChangeEvent<number>) => {
                            setSelectValue(Number(event.target.value));
                          }}
                          sx={{
                            width: "160px",
                            textAlign: "end",
                            borderRadius: "sm"
                          }}
                        >
                          <MenuItem value={USER_ACCESS_LEVELS.READ_ONLY.CODE}>
                            {USER_ACCESS_LEVELS.READ_ONLY.DISPLAY}
                          </MenuItem>
                          <MenuItem value={USER_ACCESS_LEVELS.CONDUCTOR.CODE}>
                            {USER_ACCESS_LEVELS.CONDUCTOR.DISPLAY}
                          </MenuItem>
                          <MenuItem
                            value={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                          >
                            {USER_ACCESS_LEVELS.TERRITORY_SERVANT.DISPLAY}
                          </MenuItem>
                        </Select>
                      )}
                    </ListItem>
                    <Divider />
                  </Box>
                );
              })}
            </List>
          </Box>
        </DialogContent>
        <ModalFooter
          handleClick={() => modal.hide()}
          userAccessLevel={USER_ACCESS_LEVELS.READ_ONLY.CODE}
        >
          <Button
            disabled={hasNewUser}
            onClick={() => {
              flushSync(() => {
                setUsers((existingUsers) => [
                  ...existingUsers,
                  {
                    id: "",
                    access: USER_ACCESS_LEVELS.READ_ONLY.CODE,
                    email: "",
                    name: ""
                  }
                ]);
                setSelectValue(USER_ACCESS_LEVELS.READ_ONLY.CODE);
                setInputValue("");
              });
              if (listRef.current) {
                listRef.current.scrollIntoView({
                  behavior: "smooth",
                  block: "end"
                });
              }
            }}
          >
            Add User
          </Button>
        </ModalFooter>
        {/* </ModalDialog> */}
      </Dialog>
    );
  }
);

export default GetCongregationUsers;
