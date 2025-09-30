import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, useCallback } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { UserModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import UserRoleField from "../form/role";
import HelpButton from "../navigation/help";
import AsyncSelect from "react-select/async";
import { OptionsOrGroups, GroupBase } from "react-select";
import { RecordModel } from "pocketbase";
import {
  createData,
  getFirstItemOfList,
  getPaginatedList
} from "../../utils/pocketbase";

const InviteUser = NiceModal.create(
  ({
    uid,
    congregation,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const { t } = useTranslation();
    const [userRole, setUserRole] = useState(USER_ACCESS_LEVELS.READ_ONLY.CODE);
    const [userId, setUserId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const getUsersByNames = useCallback(async (inputValue: string) => {
      return getPaginatedList("users", 1, 10, {
        filter: `(email ~ "${inputValue}%" || name ~ "${inputValue}") && verified = true`,
        requestKey: `get-users-${inputValue}`
      });
    }, []);

    const handleUserDetails = useCallback(
      async (event: FormEvent<HTMLElement>) => {
        event.preventDefault();
        setIsSaving(true);
        try {
          if (userId === uid) {
            alert(t("user.dontInviteSelf", "Please do not invite yourself."));
            return;
          }
          if (
            await getFirstItemOfList(
              "roles",
              `user="${userId}" && congregation="${congregation}"`,
              {
                requestKey: `check-role-${userId}-${congregation}`
              }
            )
          ) {
            alert(
              t(
                "user.alreadyInCongregation",
                "This user is already part of the congregation."
              )
            );
            return;
          }

          await createData(
            "roles",
            {
              user: userId,
              congregation,
              role: userRole
            },
            {
              requestKey: `create-role-${userId}-${congregation}`
            }
          );

          // Get the translated role display name based on the user's role
          let roleName;
          if (userRole === USER_ACCESS_LEVELS.READ_ONLY.CODE) {
            roleName = t("user.roles.readOnly", "Read Only");
          } else if (userRole === USER_ACCESS_LEVELS.CONDUCTOR.CODE) {
            roleName = t("user.roles.conductor", "Conductor");
          } else if (userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE) {
            roleName = t("user.roles.administrator", "Administrator");
          } else if (userRole === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
            roleName = t("user.roles.noAccess", "No Access");
          }

          alert(
            t("user.accessGranted", "Granted {{role}} access to user.", {
              role: roleName
            })
          );
          modal.hide();
        } catch (error) {
          errorHandler(error);
        } finally {
          setIsSaving(false);
        }
      },
      [userId, userRole]
    );
    const promiseOptions = async (
      inputValue: string
    ): Promise<OptionsOrGroups<unknown, GroupBase<unknown>>> => {
      const users = await getUsersByNames(inputValue);
      const options = users.items.map((user: RecordModel) => ({
        label: `${user.name} - ${user?.email}`,
        value: user.id
      }));
      return options;
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>{t("user.inviteUser", "Invite User")}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.INVITE_USER} />
        </Modal.Header>
        <Form onSubmit={handleUserDetails}>
          <Modal.Body>
            <AsyncSelect
              className="mb-3"
              placeholder={t(
                "user.searchByNameOrEmail",
                "Search for user by name or email"
              )}
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 })
              }}
              loadOptions={promiseOptions}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(option: any) => {
                setUserId(option.value);
              }}
              required
            />
            <Form.Group
              className="mb-1 text-center"
              controlId="formBasicUsrRolebtnCheckbox"
            >
              <UserRoleField
                role={userRole}
                handleRoleChange={(value) => setUserRole(value)}
                isUpdate={false}
              />
            </Form.Group>
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
            submitLabel={t("user.invite", "Invite")}
          />
        </Form>
      </Modal>
    );
  }
);

export default InviteUser;
